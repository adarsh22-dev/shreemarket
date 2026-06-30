package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Refund;
import com.sreemarket.backend.service.AdminCmsService;
import com.sreemarket.backend.service.RazorpayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/refunds")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:4173"}, allowCredentials = "true")
public class RefundController {

    @Autowired
    private RazorpayService razorpayService;

    @Autowired
    private AdminCmsService adminCmsService;

    /**
     * Processes a refund through Razorpay.
     * This is called when an admin approves a refund request.
     *
     * Request body:
     * {
     *   "refundId": "RFD-001",       // internal refund record ID
     *   "paymentId": "pay_xxx",      // Razorpay payment ID to refund
     *   "amount": 50000,             // amount in paise (optional, full refund if omitted)
     *   "reason": "Customer return"  // reason for refund
     * }
     */
    @PostMapping("/process")
    public ResponseEntity<?> processRefund(@RequestBody Map<String, Object> request) {
        try {
            String paymentId = (String) request.get("paymentId");
            if (paymentId == null || paymentId.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "paymentId is required"));
            }

            Integer amount = null;
            if (request.get("amount") != null) {
                amount = Integer.parseInt(request.get("amount").toString());
            }

            String reason = (String) request.getOrDefault("reason", "Refund requested by admin");

            Map<String, String> notes = new LinkedHashMap<>();
            notes.put("reason", reason);
            if (request.containsKey("refundId")) {
                notes.put("refundId", request.get("refundId").toString());
            }

            Map<String, Object> refundResult = razorpayService.processRefund(paymentId, amount, notes);

            // Update the internal refund record status if refundId is provided
            if (request.containsKey("refundId")) {
                try {
                    Long refundRecordId = Long.parseLong(request.get("refundId").toString());
                    Refund existingRefund = adminCmsService.getRefundById(refundRecordId);
                    if (existingRefund != null) {
                        existingRefund.setStatus("Refunded");
                        existingRefund.setResolvedOn(java.time.LocalDate.now().toString());
                        existingRefund.setMethod("Razorpay");
                        adminCmsService.saveRefund(existingRefund);
                    }
                } catch (Exception e) {
                    // Log but don't fail if refund record update fails
                    System.err.println("Warning: Failed to update refund record: " + e.getMessage());
                }
            }

            Map<String, Object> response = new LinkedHashMap<>(refundResult);
            response.put("message", "Refund processed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Fetches refund details from Razorpay by refund ID.
     */
    @GetMapping("/{refundId}/status")
    public ResponseEntity<?> getRefundStatus(@PathVariable String refundId) {
        try {
            // For now, returns the stored refund record
            // In production, you'd call razorpayService.fetchRefundDetails(refundId)
            if (refundId.matches("\\d+")) {
                Refund refund = adminCmsService.getRefundById(Long.parseLong(refundId));
                if (refund != null) {
                    return ResponseEntity.ok(refund);
                }
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
