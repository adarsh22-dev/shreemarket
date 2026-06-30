package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.Payout;
import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.repository.PayoutRepository;
import com.sreemarket.backend.repository.VendorRepository;
import com.sreemarket.backend.service.PayoutProcessingService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vendor")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorPayoutController {

    @Autowired
    private PayoutRepository payoutRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private PayoutProcessingService payoutProcessingService;

    private static final int DEFAULT_LOCK_DAYS = 90;

    private long getDeliveryEpoch(Order o) {
        if (o.getDeliveredAt() != null) return o.getDeliveredAt();
        if (o.getDatePlaced() != null) return o.getDatePlaced();
        return 0;
    }

    private boolean isEligibleForWithdrawal(Order o) {
        long deliveryEpoch = getDeliveryEpoch(o);
        if (deliveryEpoch == 0) return false;
        int lockDays = o.getWithdrawalLockDays() != null ? o.getWithdrawalLockDays() : DEFAULT_LOCK_DAYS;
        long cutoff = Instant.now().toEpochMilli() - (lockDays * 24L * 60 * 60 * 1000);
        return deliveryEpoch <= cutoff;
    }

    @GetMapping("/payouts")
    public ResponseEntity<?> getMyPayouts(HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        }
        try {
            List<Payout> payouts = payoutRepository.findByVendorId(vendorId);
            return ResponseEntity.ok(payouts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/vendor/eligible-orders
     * Returns delivered orders whose lock period (per-order withdrawalLockDays) has passed.
     */
    @GetMapping("/eligible-orders")
    public ResponseEntity<?> getEligibleOrders(HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        }
        try {
            List<Order> deliveredOrders = orderRepository.findByVendorIdAndStatus(vendorId, "DELIVERED");

            List<Map<String, Object>> eligible = deliveredOrders.stream()
                .filter(this::isEligibleForWithdrawal)
                .map(o -> {
                    long deliveryEpoch = getDeliveryEpoch(o);
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", o.getId());
                    m.put("orderNumber", o.getOrderNumber());
                    m.put("totalAmount", o.getTotalAmount() != null ? o.getTotalAmount() : 0);
                    m.put("deliveredAt", deliveryEpoch);
                    m.put("customerName", o.getCustomerName());
                    m.put("withdrawalLockDays", o.getWithdrawalLockDays() != null ? o.getWithdrawalLockDays() : DEFAULT_LOCK_DAYS);
                    long remaining = (o.getWithdrawalLockDays() != null ? o.getWithdrawalLockDays() : DEFAULT_LOCK_DAYS) * 24L * 60 * 60 * 1000
                        - (Instant.now().toEpochMilli() - deliveryEpoch);
                    m.put("remainingLockMs", Math.max(0, remaining));
                    return m;
                })
                .collect(Collectors.toList());

            // Also include ineligible orders so vendor can see upcoming releases
            List<Map<String, Object>> ineligible = deliveredOrders.stream()
                .filter(o -> !isEligibleForWithdrawal(o))
                .map(o -> {
                    long deliveryEpoch = getDeliveryEpoch(o);
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", o.getId());
                    m.put("orderNumber", o.getOrderNumber());
                    m.put("totalAmount", o.getTotalAmount() != null ? o.getTotalAmount() : 0);
                    m.put("deliveredAt", deliveryEpoch);
                    m.put("customerName", o.getCustomerName());
                    m.put("withdrawalLockDays", o.getWithdrawalLockDays() != null ? o.getWithdrawalLockDays() : DEFAULT_LOCK_DAYS);
                    long remaining = (o.getWithdrawalLockDays() != null ? o.getWithdrawalLockDays() : DEFAULT_LOCK_DAYS) * 24L * 60 * 60 * 1000
                        - (Instant.now().toEpochMilli() - deliveryEpoch);
                    m.put("remainingLockMs", Math.max(0, remaining));
                    return m;
                })
                .collect(Collectors.toList());

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("orders", eligible);
            result.put("ineligibleOrders", ineligible);
            result.put("totalGrossAmount", eligible.stream()
                .mapToDouble(e -> (Double) e.get("totalAmount")).sum());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/vendor/withdrawal-request
     * Vendor submits a withdrawal request for selected delivered orders.
     * Body: { orderIds: [Long] }
     */
    @PostMapping("/withdrawal-request")
    public ResponseEntity<?> createWithdrawalRequest(HttpServletRequest request,
                                                      @RequestBody Map<String, Object> body) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        }
        try {
            List<Integer> orderIdInts = (List<Integer>) body.get("orderIds");
            if (orderIdInts == null || orderIdInts.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No orders selected"));
            }
            List<Long> orderIds = orderIdInts.stream().map(Long::valueOf).collect(Collectors.toList());

            // Fetch orders and validate they belong to this vendor
            List<Order> orders = orderRepository.findAllById(orderIds);
            for (Order o : orders) {
                if (!vendorId.equals(o.getVendorId())) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Order " + o.getOrderNumber() + " does not belong to you"));
                }
                if (!"DELIVERED".equalsIgnoreCase(o.getStatus())) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Order " + o.getOrderNumber() + " is not delivered"));
                }
                if (!isEligibleForWithdrawal(o)) {
                    int lockDays = o.getWithdrawalLockDays() != null ? o.getWithdrawalLockDays() : DEFAULT_LOCK_DAYS;
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Order " + o.getOrderNumber() + " is not yet eligible (" + lockDays + "-day lock period)"));
                }
            }

            double grossAmount = orders.stream()
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0)
                .sum();

            Vendor vendor = vendorRepository.findById(vendorId).orElse(null);
            String vendorName = vendor != null ? vendor.getFullName() : "Unknown";

            // Calculate financial breakdown
            Map<String, Object> breakdown = payoutProcessingService.calculatePayout(vendorId, grossAmount);

            // Create payout record with status "pending"
            Payout payout = new Payout();
            payout.setPayoutId(payoutProcessingService.generatePayoutId());
            payout.setVendorId(vendorId);
            payout.setVendorName(vendorName);
            payout.setGrossAmount((Double) breakdown.get("grossAmount"));
            payout.setCommission((Double) breakdown.get("commission"));
            payout.setFee((Double) breakdown.get("fee"));
            payout.setPenalty((Double) breakdown.get("penalty"));
            payout.setTds((Double) breakdown.get("tds"));
            payout.setNetAmount((Double) breakdown.get("netAmount"));
            payout.setAmount("₹" + String.format("%,.2f", payout.getNetAmount()));
            payout.setStatus("pending");
            payout.setDate(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            payout.setOrderIds(orderIds.stream().map(String::valueOf).collect(Collectors.joining(",")));
            payout.setOrders(orderIds.size());

            Payout saved = payoutRepository.save(payout);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
