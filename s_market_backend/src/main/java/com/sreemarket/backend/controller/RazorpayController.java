package com.sreemarket.backend.controller;

import com.sreemarket.backend.service.RazorpayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:4173"}, allowCredentials = "true")
public class RazorpayController {

    @Autowired
    private RazorpayService razorpayService;

    /**
     * Creates a Razorpay order for checkout.
     * Called by the frontend when the user clicks "Place Order".
     *
     * Request body:
     * {
     *   "amount": 50000,       // amount in paise (₹500 = 50000 paise)
     *   "currency": "INR",     // optional, defaults to INR
     *   "receipt": "order_123", // unique receipt ID
     *   "notes": {             // optional
     *     "orderId": "123",
     *     "userId": "456"
     *   }
     * }
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> request) {
        try {
            int amount = Integer.parseInt(request.getOrDefault("amount", "0").toString());
            if (amount <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid amount"));
            }

            String currency = (String) request.getOrDefault("currency", "INR");
            String receipt = (String) request.getOrDefault("receipt", "");

            @SuppressWarnings("unchecked")
            Map<String, String> notes = (Map<String, String>) request.get("notes");

            Map<String, Object> order = razorpayService.createPaymentOrder(amount, currency, receipt, notes);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verifies the payment signature after a successful Razorpay payment.
     * Called by the frontend after the Razorpay checkout completes.
     *
     * Request body:
     * {
     *   "razorpay_order_id": "order_xxx",
     *   "razorpay_payment_id": "pay_xxx",
     *   "razorpay_signature": "signature_xxx"
     * }
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> paymentData) {
        try {
            String razorpayOrderId = paymentData.get("razorpay_order_id");
            String razorpayPaymentId = paymentData.get("razorpay_payment_id");
            String razorpaySignature = paymentData.get("razorpay_signature");

            if (razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature"
                ));
            }

            boolean isValid = razorpayService.verifyPaymentSignature(
                razorpayOrderId, razorpayPaymentId, razorpaySignature
            );

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("isValid", isValid);
            response.put("razorpay_order_id", razorpayOrderId);
            response.put("razorpay_payment_id", razorpayPaymentId);

            if (isValid) {
                response.put("status", "success");
                response.put("message", "Payment verified successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "failed");
                response.put("message", "Payment signature verification failed");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Fetches payment details from Razorpay by payment ID.
     *
     * @param paymentId The Razorpay payment ID
     */
    @GetMapping("/payment/{paymentId}")
    public ResponseEntity<?> getPaymentDetails(@PathVariable String paymentId) {
        try {
            Map<String, Object> details = razorpayService.fetchPaymentDetails(paymentId);
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Fetches order details from Razorpay by order ID.
     *
     * @param orderId The Razorpay order ID
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getOrderDetails(@PathVariable String orderId) {
        try {
            Map<String, Object> details = razorpayService.fetchOrderDetails(orderId);
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    /**
     * Returns the Razorpay key ID for the frontend to initialize the checkout.
     */
    @GetMapping("/config")
    public ResponseEntity<?> getPaymentConfig() {
        return ResponseEntity.ok(Map.of("key_id", razorpayKeyId));
    }
}
