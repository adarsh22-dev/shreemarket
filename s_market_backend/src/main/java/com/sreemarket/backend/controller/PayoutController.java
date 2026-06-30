package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Payout;
import com.sreemarket.backend.model.PayoutBatch;
import com.sreemarket.backend.repository.PayoutBatchRepository;
import com.sreemarket.backend.repository.PayoutRepository;
import com.sreemarket.backend.service.PayoutProcessingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/payout-processing")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PayoutController {

    @Autowired
    private PayoutProcessingService payoutProcessingService;

    @Autowired
    private PayoutRepository payoutRepository;

    @Autowired
    private PayoutBatchRepository batchRepository;

    /**
     * GET /api/admin/payout-processing/stats
     * Returns payout processing statistics for the admin dashboard.
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getPayoutStats() {
        try {
            return ResponseEntity.ok(payoutProcessingService.getProcessingStats());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/admin/payout-processing/batches
     * Returns all payout batches.
     */
    @GetMapping("/batches")
    public ResponseEntity<?> getBatches() {
        try {
            return ResponseEntity.ok(batchRepository.findAllByOrderByCreatedAtDesc());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/admin/payout-processing/batches/{id}
     * Returns a specific batch by ID.
     */
    @GetMapping("/batches/{id}")
    public ResponseEntity<?> getBatchById(@PathVariable Long id) {
        try {
            PayoutBatch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
            return ResponseEntity.ok(batch);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/payout-processing/calculate
     * Calculate payout breakdown for a vendor.
     * Request body: { vendorId: Long, grossAmount: Double }
     */
    @PostMapping("/calculate")
    public ResponseEntity<?> calculatePayout(@RequestBody Map<String, Object> request) {
        try {
            Long vendorId = request.get("vendorId") != null ? Long.valueOf(request.get("vendorId").toString()) : 0L;
            Double grossAmount = request.get("grossAmount") != null ? Double.valueOf(request.get("grossAmount").toString()) : 0.0;
            return ResponseEntity.ok(payoutProcessingService.calculatePayout(vendorId, grossAmount));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/payout-processing/process-single
     * Process a single payout by ID.
     */
    @PostMapping("/process-single")
    public ResponseEntity<?> processSinglePayout(@RequestBody Map<String, Object> request) {
        try {
            Long payoutId = Long.valueOf(request.get("payoutId").toString());
            String adminUser = request.get("adminUser") != null ? request.get("adminUser").toString() : "Admin";

            Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new RuntimeException("Payout not found"));

            Payout processed = payoutProcessingService.processSinglePayout(payout, adminUser);
            return ResponseEntity.ok(processed);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/payout-processing/process-batch
     * Process a batch of payouts.
     * Request body: { payoutIds: [Long], method: String }
     */
    @PostMapping("/process-batch")
    public ResponseEntity<?> processBatch(@RequestBody Map<String, Object> request) {
        try {
            List<Integer> payoutIdInts = (List<Integer>) request.get("payoutIds");
            List<Long> payoutIds = payoutIdInts.stream().map(Long::valueOf).collect(Collectors.toList());
            String method = request.get("method") != null ? request.get("method").toString() : "NEFT";
            String adminUser = request.get("adminUser") != null ? request.get("adminUser").toString() : "Admin";
            Long adminUserId = request.get("adminUserId") != null ? Long.valueOf(request.get("adminUserId").toString()) : 1L;

            PayoutBatch batch = payoutProcessingService.processBatch(payoutIds, method, adminUserId, adminUser);
            return ResponseEntity.ok(batch);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/payout-processing/execute-schedules
     * Execute all scheduled payouts that are due.
     */
    @PostMapping("/execute-schedules")
    public ResponseEntity<?> executeSchedules(@RequestBody Map<String, Object> request) {
        try {
            String adminUser = request.get("adminUser") != null ? request.get("adminUser").toString() : "Admin";
            Long adminUserId = request.get("adminUserId") != null ? Long.valueOf(request.get("adminUserId").toString()) : 1L;

            List<PayoutBatch> batches = payoutProcessingService.executeScheduledPayouts(adminUserId, adminUser);
            return ResponseEntity.ok(Map.of(
                "message", "Scheduled payout execution completed",
                "batchesProcessed", batches.size(),
                "batches", batches
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/payout-processing/schedules/{scheduleId}/run-now
     * Manually trigger a schedule for immediate execution.
     */
    @PostMapping("/schedules/{scheduleId}/run-now")
    public ResponseEntity<?> runScheduleNow(@PathVariable Long scheduleId, @RequestBody Map<String, Object> request) {
        try {
            String adminUser = request.get("adminUser") != null ? request.get("adminUser").toString() : "Admin";
            Long adminUserId = request.get("adminUserId") != null ? Long.valueOf(request.get("adminUserId").toString()) : 1L;

            PayoutBatch batch = payoutProcessingService.runScheduleNow(scheduleId, adminUserId, adminUser);
            return ResponseEntity.ok(batch);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/admin/payout-processing/payouts/{id}/receipt
     * Get the HTML receipt for a paid payout.
     */
    @GetMapping("/payouts/{id}/receipt")
    public ResponseEntity<?> getPayoutReceipt(@PathVariable Long id) {
        try {
            Payout payout = payoutRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payout not found"));

            if (payout.getReceiptHtml() == null || payout.getReceiptHtml().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No receipt available for this payout"));
            }

            return ResponseEntity.ok()
                .header("Content-Type", "text/html; charset=utf-8")
                .body(payout.getReceiptHtml());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/admin/payout-processing/payouts
     * Get all payouts with optional status/search filtering.
     */
    @GetMapping("/payouts")
    public ResponseEntity<?> getPayouts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        try {
            List<Payout> payouts;
            if (search != null && !search.isEmpty()) {
                payouts = payoutRepository.findByVendorNameContainingIgnoreCase(search);
            } else if (status != null && !status.isEmpty()) {
                payouts = payoutRepository.findByStatus(status);
            } else {
                payouts = payoutRepository.findAllByOrderByDateDesc(PageRequest.of(0, 100));
                if (payouts == null) payouts = payoutRepository.findAll();
            }
            return ResponseEntity.ok(payouts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/admin/payout-processing/payouts/{id}
     * Get a single payout by ID.
     */
    @GetMapping("/payouts/{id}")
    public ResponseEntity<?> getPayoutById(@PathVariable Long id) {
        try {
            Payout payout = payoutRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payout not found"));
            return ResponseEntity.ok(payout);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/payout-processing/payouts
     * Create a new payout record.
     */
    @PostMapping("/payouts")
    public ResponseEntity<?> createPayout(@RequestBody Map<String, Object> request) {
        try {
            String method = request.get("method") != null ? request.get("method").toString() : "NEFT";
            String vendorName = request.get("vendorName") != null ? request.get("vendorName").toString() : "Unknown";
            Long vendorId = request.get("vendorId") != null ? Long.valueOf(request.get("vendorId").toString()) : null;
            Double grossAmount = request.get("grossAmount") != null ? Double.valueOf(request.get("grossAmount").toString()) : 0.0;
            String period = request.get("period") != null ? request.get("period").toString() : "";

            Payout payout = new Payout();
            payout.setPayoutId(payoutProcessingService.generatePayoutId());
            payout.setVendorId(vendorId);
            payout.setVendorName(vendorName);
            payout.setGrossAmount(grossAmount);
            payout.setMethod(method);
            payout.setStatus("pending");
            payout.setDate(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            payout.setPeriod(period);

            // Calculate financial breakdown
            Map<String, Object> breakdown = payoutProcessingService.calculatePayout(
                vendorId != null ? vendorId : 0L, grossAmount);
            payout.setCommission((Double) breakdown.get("commission"));
            payout.setFee((Double) breakdown.get("fee"));
            payout.setPenalty((Double) breakdown.get("penalty"));
            payout.setTds((Double) breakdown.get("tds"));
            payout.setNetAmount((Double) breakdown.get("netAmount"));
            payout.setAmount("₹" + String.format("%,.2f", payout.getNetAmount()));

            Payout saved = payoutRepository.save(payout);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/admin/payout-processing/payouts
     * Update an existing payout (status update, etc.).
     */
    @PutMapping("/payouts")
    public ResponseEntity<?> updatePayout(@RequestBody Map<String, Object> request) {
        try {
            Long id = Long.valueOf(request.get("id").toString());
            Payout payout = payoutRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payout not found"));

            if (request.containsKey("status")) {
                payout.setStatus(request.get("status").toString());
            }
            if (request.containsKey("method")) {
                payout.setMethod(request.get("method").toString());
            }
            if (request.containsKey("notes")) {
                payout.setNotes(request.get("notes").toString());
            }
            if (request.containsKey("transactionId")) {
                payout.setTransactionId(request.get("transactionId").toString());
            }

            return ResponseEntity.ok(payoutRepository.save(payout));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/admin/payout-processing/payouts/{id}
     * Delete a payout record.
     */
    @DeleteMapping("/payouts/{id}")
    public ResponseEntity<?> deletePayout(@PathVariable Long id) {
        try {
            payoutRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Payout deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
