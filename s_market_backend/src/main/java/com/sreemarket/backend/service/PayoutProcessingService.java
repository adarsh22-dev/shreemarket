package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Payout;
import com.sreemarket.backend.model.PayoutBatch;
import com.sreemarket.backend.model.PayoutSchedule;
import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.repository.PayoutBatchRepository;
import com.sreemarket.backend.repository.PayoutRepository;
import com.sreemarket.backend.repository.PayoutScheduleRepository;
import com.sreemarket.backend.repository.VendorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PayoutProcessingService {

    private static final Logger log = LoggerFactory.getLogger(PayoutProcessingService.class);

    @Autowired
    private PayoutRepository payoutRepository;

    @Autowired
    private PayoutBatchRepository batchRepository;

    @Autowired
    private PayoutScheduleRepository scheduleRepository;

    @Autowired
    private VendorRepository vendorRepository;

    private final Random random = new Random();

    // ── TDS rate (10% for vendors above threshold, configurable) ──
    private static final double TDS_RATE = 0.10;
    private static final double TDS_THRESHOLD = 5000.0;

    // ── Platform fee per payout (fixed) ──
    private static final double PLATFORM_FEE = 0.0;

    /**
     * Generate the next payout ID.
     */
    public String generatePayoutId() {
        long next = payoutRepository.count() + 1;
        String datePart = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now());
        return "PAY-" + datePart + "-" + String.format("%04d", next);
    }

    /**
     * Generate the next batch ID.
     */
    public String generateBatchId() {
        Long maxId = batchRepository.getMaxId();
        long next = (maxId != null ? maxId : 0) + 1;
        String datePart = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now());
        return "BATCH-" + datePart + "-" + String.format("%04d", next);
    }

    /**
     * Calculate financial breakdown for a vendor payout.
     */
    public Map<String, Object> calculatePayout(Long vendorId, Double grossAmount) {
        Map<String, Object> breakdown = new HashMap<>();

        double commission = 0.0;
        double fee = PLATFORM_FEE;
        double penalty = 0.0;

        // Look up vendor to get commission rate
        Vendor vendor = vendorRepository.findById(vendorId).orElse(null);
        if (vendor != null && vendor.getCommissionRate() != null) {
            commission = grossAmount * (vendor.getCommissionRate() / 100.0);
        } else {
            // Default 10% commission
            commission = grossAmount * 0.10;
        }

        // TDS applicable only if net after commission exceeds threshold
        double afterCommission = grossAmount - commission - fee - penalty;
        double tds = 0.0;
        if (afterCommission > TDS_THRESHOLD) {
            tds = afterCommission * TDS_RATE;
        }

        double netAmount = afterCommission - tds;

        breakdown.put("grossAmount", Math.round(grossAmount * 100.0) / 100.0);
        breakdown.put("commission", Math.round(commission * 100.0) / 100.0);
        breakdown.put("fee", Math.round(fee * 100.0) / 100.0);
        breakdown.put("penalty", Math.round(penalty * 100.0) / 100.0);
        breakdown.put("tds", Math.round(tds * 100.0) / 100.0);
        breakdown.put("netAmount", Math.round(netAmount * 100.0) / 100.0);
        breakdown.put("vendorName", vendor != null ? vendor.getFullName() : "Unknown");

        return breakdown;
    }

    /**
     * Process a single payout via mock payment gateway (NEFT/IMPS/RTGS/UPI).
     * Returns a map with transaction details.
     */
    public Map<String, String> processPayment(Payout payout) {
        Map<String, String> result = new HashMap<>();
        String method = payout.getMethod() != null ? payout.getMethod() : "NEFT";

        try {
            // Simulate payment processing delay (100-300ms)
            Thread.sleep(100 + random.nextInt(200));

            // Simulate 95% success rate
            boolean success = random.nextDouble() < 0.95;

            if (success) {
                String transactionId = "TXN" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
                String utrNumber = "UTR" + System.currentTimeMillis() + String.format("%04d", random.nextInt(10000));

                result.put("status", "paid");
                result.put("transactionId", transactionId);
                result.put("utrNumber", utrNumber);
                result.put("message", "Payment processed successfully");

                if ("UPI".equalsIgnoreCase(method)) {
                    result.put("upiRef", "UPI" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
                } else {
                    result.put("bankRef", "BNK" + System.currentTimeMillis());
                }

                result.put("receiptHtml", generateReceiptHtml(payout, transactionId, utrNumber));
            } else {
                result.put("status", "failed");
                result.put("transactionId", null);
                result.put("message", "Payment gateway error: Insufficient funds / Bank timeout");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            result.put("status", "failed");
            result.put("message", "Payment processing interrupted");
        }

        return result;
    }

    /**
     * Generate an HTML receipt for a successful payout.
     */
    private String generateReceiptHtml(Payout payout, String transactionId, String utrNumber) {
        return "<html><body style='font-family:Arial,sans-serif;padding:30px;'>"
            + "<h2 style='color:#E03E1A;'>Payment Receipt</h2>"
            + "<hr/>"
            + "<p><strong>Receipt No:</strong> " + (payout.getPayoutId() != null ? payout.getPayoutId() : "—") + "</p>"
            + "<p><strong>Transaction ID:</strong> " + transactionId + "</p>"
            + "<p><strong>UTR Number:</strong> " + utrNumber + "</p>"
            + "<p><strong>Method:</strong> " + (payout.getMethod() != null ? payout.getMethod() : "NEFT") + "</p>"
            + "<p><strong>Vendor:</strong> " + (payout.getVendorName() != null ? payout.getVendorName() : "—") + "</p>"
            + "<hr/>"
            + "<p><strong>Gross Amount:</strong> ₹" + String.format("%,.2f", payout.getGrossAmount() != null ? payout.getGrossAmount() : 0) + "</p>"
            + "<p><strong>Commission:</strong> -₹" + String.format("%,.2f", payout.getCommission() != null ? payout.getCommission() : 0) + "</p>"
            + "<p><strong>Fee:</strong> -₹" + String.format("%,.2f", payout.getFee() != null ? payout.getFee() : 0) + "</p>"
            + "<p><strong>TDS:</strong> -₹" + String.format("%,.2f", payout.getTds() != null ? payout.getTds() : 0) + "</p>"
            + "<p><strong>Penalty:</strong> -₹" + String.format("%,.2f", payout.getPenalty() != null ? payout.getPenalty() : 0) + "</p>"
            + "<hr/>"
            + "<h3 style='color:#16a34a;'>Net Amount: ₹" + String.format("%,.2f", payout.getNetAmount() != null ? payout.getNetAmount() : 0) + "</h3>"
            + "<hr/>"
            + "<p style='color:#64748b;font-size:0.85em;'>Processed on: " + java.time.Instant.now().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime().toString() + "</p>"
            + "</body></html>";
    }

    /**
     * Process a single payout: calculate financials, make payment, update record.
     */
    @Transactional
    public Payout processSinglePayout(Payout payout, String adminUser) {
        // Calculate financial breakdown
        Map<String, Object> breakdown = calculatePayout(
            payout.getVendorId() != null ? payout.getVendorId() : 0L,
            payout.getGrossAmount() != null ? payout.getGrossAmount() : 0.0
        );

        payout.setGrossAmount((Double) breakdown.get("grossAmount"));
        payout.setCommission((Double) breakdown.get("commission"));
        payout.setFee((Double) breakdown.get("fee"));
        payout.setPenalty((Double) breakdown.get("penalty"));
        payout.setTds((Double) breakdown.get("tds"));
        payout.setNetAmount((Double) breakdown.get("netAmount"));
        payout.setAmount("₹" + String.format("%,.2f", payout.getNetAmount()));
        payout.setStatus("processing");
        payout = payoutRepository.save(payout);

        // Process payment via gateway
        Map<String, String> paymentResult = processPayment(payout);

        // Update with payment result
        payout.setStatus(paymentResult.get("status"));
        payout.setTransactionId(paymentResult.get("transactionId"));
        payout.setUtrNumber(paymentResult.get("utrNumber"));
        payout.setBankRef(paymentResult.get("bankRef"));
        payout.setUpiRef(paymentResult.get("upiRef"));
        payout.setProcessedAt(Instant.now().toEpochMilli());

        if ("paid".equals(paymentResult.get("status"))) {
            payout.setReceiptHtml(paymentResult.get("receiptHtml"));
            payout.setNotes("Processed by " + adminUser + " on " + LocalDate.now());
        } else {
            payout.setNotes("FAILED: " + paymentResult.get("message") + " | Attempted by " + adminUser);
        }

        return payoutRepository.save(payout);
    }

    /**
     * Process a batch of payouts.
     */
    @Transactional
    public PayoutBatch processBatch(List<Long> payoutIds, String method, Long adminUserId, String adminUser) {
        List<Payout> payouts = payoutRepository.findAllById(payoutIds);

        // Create batch record
        PayoutBatch batch = new PayoutBatch();
        batch.setBatchId(generateBatchId());
        batch.setCreatedAt(Instant.now().toEpochMilli());
        batch.setStartedAt(Instant.now().toEpochMilli());
        batch.setMethod(method);
        batch.setStatus("processing");
        batch.setProcessedBy(adminUserId);
        batch.setVendorCount(payouts.size());
        batch.setNotes("Batch processed by " + adminUser);
        batch = batchRepository.save(batch);

        int successCount = 0;
        int failedCount = 0;
        double totalGross = 0;
        double totalComm = 0;
        double totalFee = 0;
        double totalTds = 0;
        double totalPenalty = 0;
        double totalNet = 0;

        List<String> errors = new ArrayList<>();

        for (Payout payout : payouts) {
            try {
                payout.setMethod(method);
                payout.setBatchId(batch.getBatchId());
                Payout processed = processSinglePayout(payout, adminUser);
                if ("paid".equals(processed.getStatus())) {
                    successCount++;
                } else {
                    failedCount++;
                    errors.add("Payout " + (payout.getPayoutId() != null ? payout.getPayoutId() : payout.getId()) + ": " + (processed.getNotes() != null ? processed.getNotes() : "Unknown error"));
                }
                totalGross += processed.getGrossAmount() != null ? processed.getGrossAmount() : 0;
                totalComm += processed.getCommission() != null ? processed.getCommission() : 0;
                totalFee += processed.getFee() != null ? processed.getFee() : 0;
                totalTds += processed.getTds() != null ? processed.getTds() : 0;
                totalPenalty += processed.getPenalty() != null ? processed.getPenalty() : 0;
                totalNet += processed.getNetAmount() != null ? processed.getNetAmount() : 0;
            } catch (Exception e) {
                failedCount++;
                errors.add("Payout " + (payout.getPayoutId() != null ? payout.getPayoutId() : payout.getId()) + ": " + e.getMessage());
                log.error("Failed to process payout {}: {}", payout.getId(), e.getMessage());
            }
        }

        // Update batch record
        batch.setCompletedAt(Instant.now().toEpochMilli());
        batch.setSuccessCount(successCount);
        batch.setFailedCount(failedCount);
        batch.setTotalGrossAmount(Math.round(totalGross * 100.0) / 100.0);
        batch.setTotalCommission(Math.round(totalComm * 100.0) / 100.0);
        batch.setTotalFee(Math.round(totalFee * 100.0) / 100.0);
        batch.setTotalTds(Math.round(totalTds * 100.0) / 100.0);
        batch.setTotalPenalty(Math.round(totalPenalty * 100.0) / 100.0);
        batch.setTotalNetAmount(Math.round(totalNet * 100.0) / 100.0);

        if (failedCount == 0) {
            batch.setStatus("completed");
        } else if (successCount > 0) {
            batch.setStatus("partially_completed");
        } else {
            batch.setStatus("failed");
        }

        if (!errors.isEmpty()) {
            batch.setErrorDetails(String.join("\n", errors));
        }

        return batchRepository.save(batch);
    }

    /**
     * Get payout processing stats for the admin dashboard.
     */
    public Map<String, Object> getProcessingStats() {
        Map<String, Object> stats = new HashMap<>();

        List<Payout> allPayouts = payoutRepository.findAll();
        List<Payout> pendingPayouts = allPayouts.stream()
            .filter(p -> "pending".equalsIgnoreCase(p.getStatus()))
            .collect(Collectors.toList());
        List<Payout> processingPayouts = allPayouts.stream()
            .filter(p -> "processing".equalsIgnoreCase(p.getStatus()))
            .collect(Collectors.toList());
        List<Payout> paidThisMonth = allPayouts.stream()
            .filter(p -> "paid".equalsIgnoreCase(p.getStatus()))
            .filter(p -> {
                if (p.getProcessedAt() == null) return false;
                Instant inst = Instant.ofEpochMilli(p.getProcessedAt());
                LocalDate date = inst.atZone(ZoneId.systemDefault()).toLocalDate();
                return date.getMonth() == LocalDate.now().getMonth() && date.getYear() == LocalDate.now().getYear();
            })
            .collect(Collectors.toList());

        double pendingTotal = pendingPayouts.stream()
            .mapToDouble(p -> p.getGrossAmount() != null ? p.getGrossAmount() : 0).sum();
        double monthlyPaid = paidThisMonth.stream()
            .mapToDouble(p -> p.getNetAmount() != null ? p.getNetAmount() : 0).sum();
        double monthlyCommission = paidThisMonth.stream()
            .mapToDouble(p -> p.getCommission() != null ? p.getCommission() : 0).sum();

        stats.put("pendingCount", pendingPayouts.size());
        stats.put("pendingTotal", Math.round(pendingTotal * 100.0) / 100.0);
        stats.put("processingCount", processingPayouts.size());
        stats.put("paidThisMonth", Math.round(monthlyPaid * 100.0) / 100.0);
        stats.put("monthlyCommission", Math.round(monthlyCommission * 100.0) / 100.0);
        stats.put("totalPayouts", allPayouts.size());

        return stats;
    }

    /**
     * Execute scheduled payouts that are due.
     */
    @Transactional
    public List<PayoutBatch> executeScheduledPayouts(Long adminUserId, String adminUser) {
        List<PayoutBatch> batches = new ArrayList<>();
        List<PayoutSchedule> activeSchedules = scheduleRepository.findByStatus("active");

        LocalDate today = LocalDate.now();
        String todayStr = today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        for (PayoutSchedule schedule : activeSchedules) {
            try {
                // Check if the schedule is due
                if (schedule.getNextRun() == null || schedule.getNextRun().isEmpty()) continue;
                if (!schedule.getNextRun().equals(todayStr)) continue;
                if (schedule.getVendorId() == null) continue;

                // Find pending payouts for this vendor
                List<Payout> vendorPayouts = payoutRepository.findAll().stream()
                    .filter(p -> schedule.getVendorId().equals(p.getVendorId()))
                    .filter(p -> "pending".equalsIgnoreCase(p.getStatus()))
                    .filter(p -> {
                        if (schedule.getThreshold() != null && schedule.getThreshold() > 0) {
                            return p.getGrossAmount() != null && p.getGrossAmount() >= schedule.getThreshold();
                        }
                        return true;
                    })
                    .collect(Collectors.toList());

                if (vendorPayouts.isEmpty()) continue;

                // If auto-approve is enabled, process the payout
                if (Boolean.TRUE.equals(schedule.getAutoApprove())) {
                    List<Long> payoutIds = vendorPayouts.stream().map(Payout::getId).collect(Collectors.toList());
                    PayoutBatch batch = processBatch(payoutIds, schedule.getMethod(), adminUserId, adminUser);
                    batches.add(batch);
                }

                // Update schedule's nextRun
                updateNextRun(schedule);
                scheduleRepository.save(schedule);

            } catch (Exception e) {
                log.error("Failed to execute schedule {}: {}", schedule.getId(), e.getMessage());
            }
        }

        return batches;
    }

    /**
     * Calculate the next run date based on frequency and day.
     */
    private void updateNextRun(PayoutSchedule schedule) {
        LocalDate today = LocalDate.now();
        LocalDate next;

        switch (schedule.getFrequency() != null ? schedule.getFrequency() : "monthly") {
            case "weekly":
                next = today.plusWeeks(1);
                break;
            case "biweekly":
                next = today.plusWeeks(2);
                break;
            case "on-request":
                schedule.setNextRun("—");
                return;
            case "monthly":
            default:
                next = today.plusMonths(1);
                break;
        }

        schedule.setNextRun(next.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        schedule.setLastRun(today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
    }

    /**
     * Run a schedule immediately (manual trigger).
     */
    @Transactional
    public PayoutBatch runScheduleNow(Long scheduleId, Long adminUserId, String adminUser) {
        PayoutSchedule schedule = scheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Schedule not found"));

        List<Payout> vendorPayouts = payoutRepository.findAll().stream()
            .filter(p -> schedule.getVendorId().equals(p.getVendorId()))
            .filter(p -> "pending".equalsIgnoreCase(p.getStatus()))
            .collect(Collectors.toList());

        if (vendorPayouts.isEmpty()) {
            throw new RuntimeException("No pending payouts for this vendor");
        }

        List<Long> payoutIds = vendorPayouts.stream().map(Payout::getId).collect(Collectors.toList());
        PayoutBatch batch = processBatch(payoutIds, schedule.getMethod(), adminUserId, adminUser);

        // Update schedule's lastRun
        schedule.setLastRun(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        scheduleRepository.save(schedule);

        return batch;
    }
}
