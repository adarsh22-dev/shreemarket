package com.sreemarket.backend.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Refund;
import com.sreemarket.backend.model.PaymentGatewayLog;
import jakarta.annotation.PostConstruct;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.SignatureException;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class RazorpayService {

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    private RazorpayClient razorpayClient;

    @Autowired
    private PaymentGatewayLogService paymentGatewayLogService;

    @PostConstruct
    public void init() {
        try {
            razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        } catch (RazorpayException e) {
            // Log warning but don't fail startup - keys may be placeholders
            System.err.println("Warning: Failed to initialize Razorpay client: " + e.getMessage());
        }
    }

    /**
     * Creates a Razorpay order for a given amount.
     *
     * @param amount   Amount in paise (INR smallest unit). E.g., ₹100 = 10000 paise
     * @param currency Currency code (default: INR)
     * @param receipt  Unique receipt ID (e.g., order number)
     * @param notes    Optional notes to attach
     * @return Map with order_id, amount, currency, key_id, etc.
     */
    public Map<String, Object> createPaymentOrder(int amount, String currency, String receipt, Map<String, String> notes) {
        try {
            if (razorpayClient == null) {
                razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            }

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amount); // amount in paise
            orderRequest.put("currency", currency != null ? currency : "INR");
            orderRequest.put("receipt", receipt);
            orderRequest.put("payment_capture", 1); // auto-capture

            if (notes != null && !notes.isEmpty()) {
                JSONObject notesObj = new JSONObject();
                for (Map.Entry<String, String> entry : notes.entrySet()) {
                    notesObj.put(entry.getKey(), entry.getValue());
                }
                orderRequest.put("notes", notesObj);
            }

            Order razorpayOrder = razorpayClient.orders.create(orderRequest);

            // Log the order creation
            PaymentGatewayLog log = new PaymentGatewayLog();
            log.setTransactionId(razorpayOrder.get("id"));
            log.setGateway("razorpay");
            log.setType("ORDER_CREATE");
            log.setAmount((double) amount / 100); // convert paise to rupees
            log.setCurrency(currency != null ? currency : "INR");
            log.setStatus("created");
            log.setReference(receipt);
            log.setCreatedAt(Instant.now().toEpochMilli());
            log.setResponseData(razorpayOrder.toString());
            paymentGatewayLogService.save(log);

            // Build response map
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", razorpayOrder.get("id"));
            response.put("entity", razorpayOrder.get("entity"));
            response.put("amount", razorpayOrder.get("amount"));
            response.put("amount_paid", razorpayOrder.get("amount_paid"));
            response.put("amount_due", razorpayOrder.get("amount_due"));
            response.put("currency", razorpayOrder.get("currency"));
            response.put("receipt", razorpayOrder.get("receipt"));
            response.put("status", razorpayOrder.get("status"));
            response.put("attempts", razorpayOrder.get("attempts"));
            response.put("created_at", razorpayOrder.get("created_at"));
            response.put("key_id", razorpayKeyId);

            return response;
        } catch (RazorpayException e) {
            PaymentGatewayLog log = new PaymentGatewayLog();
            log.setGateway("razorpay");
            log.setType("ORDER_CREATE");
            log.setStatus("failed");
            log.setReference(receipt);
            log.setCreatedAt(Instant.now().toEpochMilli());
            log.setResponseData("Error: " + e.getMessage());
            paymentGatewayLogService.save(log);

            throw new RuntimeException("Failed to create Razorpay order: " + e.getMessage());
        }
    }

    /**
     * Verifies the payment signature returned by Razorpay after a successful payment.
     * This is the server-side verification to prevent tampering.
     *
     * @param razorpayOrderId  The Razorpay order ID
     * @param razorpayPaymentId The Razorpay payment ID
     * @param razorpaySignature The signature returned by Razorpay
     * @return true if signature is valid
     */
    public boolean verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(razorpayKeySecret.getBytes(), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes());
            String expectedSignature = Base64.getEncoder().encodeToString(hash);

            boolean isValid = expectedSignature.equals(razorpaySignature);

            // Log the verification
            PaymentGatewayLog log = new PaymentGatewayLog();
            log.setTransactionId(razorpayPaymentId);
            log.setGateway("razorpay");
            log.setType("PAYMENT_VERIFY");
            log.setStatus(isValid ? "verified" : "verification_failed");
            log.setReference(razorpayOrderId);
            log.setCreatedAt(Instant.now().toEpochMilli());
            log.setResponseData(String.format(
                "orderId=%s, paymentId=%s, signature=%s, isValid=%s",
                razorpayOrderId, razorpayPaymentId, razorpaySignature, isValid
            ));
            paymentGatewayLogService.save(log);

            return isValid;
        } catch (Exception e) {
            PaymentGatewayLog log = new PaymentGatewayLog();
            log.setTransactionId(razorpayPaymentId);
            log.setGateway("razorpay");
            log.setType("PAYMENT_VERIFY");
            log.setStatus("error");
            log.setReference(razorpayOrderId);
            log.setCreatedAt(Instant.now().toEpochMilli());
            log.setResponseData("Verification error: " + e.getMessage());
            paymentGatewayLogService.save(log);

            return false;
        }
    }

    /**
     * Fetches payment details from Razorpay using the payment ID.
     *
     * @param paymentId The Razorpay payment ID
     * @return Map containing payment details
     */
    public Map<String, Object> fetchPaymentDetails(String paymentId) {
        try {
            if (razorpayClient == null) {
                razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            }
            com.razorpay.Payment payment = razorpayClient.payments.fetch(paymentId);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", payment.get("id"));
            response.put("entity", payment.get("entity"));
            response.put("amount", payment.get("amount"));
            response.put("currency", payment.get("currency"));
            response.put("status", payment.get("status"));
            response.put("order_id", payment.get("order_id"));
            response.put("method", payment.get("method"));
            response.put("amount_refunded", payment.get("amount_refunded"));
            response.put("description", payment.get("description"));
            response.put("email", payment.get("email"));
            response.put("contact", payment.get("contact"));
            response.put("fee", payment.get("fee"));
            response.put("tax", payment.get("tax"));
            response.put("created_at", payment.get("created_at"));

            return response;
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to fetch payment details: " + e.getMessage());
        }
    }

    /**
     * Processes a refund through Razorpay for a completed payment.
     *
     * @param paymentId The Razorpay payment ID to refund
     * @param amount    Amount to refund in paise (null for full refund)
     * @param notes     Optional notes about the refund
     * @return Map containing refund details
     */
    public Map<String, Object> processRefund(String paymentId, Integer amount, Map<String, String> notes) {
        try {
            if (razorpayClient == null) {
                razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            }

            JSONObject refundRequest = new JSONObject();
            if (amount != null && amount > 0) {
                refundRequest.put("amount", amount);
            }
            if (notes != null && !notes.isEmpty()) {
                JSONObject notesObj = new JSONObject();
                for (Map.Entry<String, String> entry : notes.entrySet()) {
                    notesObj.put(entry.getKey(), entry.getValue());
                }
                refundRequest.put("notes", notesObj);
            }
            refundRequest.put("speed", "normal"); // normal or optimum

            Refund refund = razorpayClient.payments.refund(paymentId, refundRequest);

            // Log the refund
            PaymentGatewayLog log = new PaymentGatewayLog();
            log.setTransactionId(refund.get("id"));
            log.setGateway("razorpay");
            log.setType("REFUND");
            log.setAmount(refund.get("amount") != null ? ((Number) refund.get("amount")).doubleValue() / 100 : 0);
            log.setCurrency("INR");
            log.setStatus("processed");
            log.setReference(paymentId);
            log.setCreatedAt(Instant.now().toEpochMilli());
            log.setResponseData(refund.toString());
            paymentGatewayLogService.save(log);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", refund.get("id"));
            response.put("payment_id", paymentId);
            response.put("amount", refund.get("amount"));
            response.put("currency", refund.get("currency"));
            response.put("status", refund.get("status"));
            response.put("created_at", refund.get("created_at"));
            response.put("speed", refund.get("speed"));
            response.put("speed_requested", refund.get("speed_requested"));

            return response;
        } catch (RazorpayException e) {
            PaymentGatewayLog log = new PaymentGatewayLog();
            log.setTransactionId(paymentId);
            log.setGateway("razorpay");
            log.setType("REFUND");
            log.setStatus("failed");
            log.setCreatedAt(Instant.now().toEpochMilli());
            log.setResponseData("Refund error: " + e.getMessage());
            paymentGatewayLogService.save(log);

            throw new RuntimeException("Failed to process refund: " + e.getMessage());
        }
    }

    /**
     * Fetches an order's details from Razorpay.
     *
     * @param orderId The Razorpay order ID
     * @return Map containing order details
     */
    public Map<String, Object> fetchOrderDetails(String orderId) {
        try {
            if (razorpayClient == null) {
                razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            }
            Order order = razorpayClient.orders.fetch(orderId);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", order.get("id"));
            response.put("entity", order.get("entity"));
            response.put("amount", order.get("amount"));
            response.put("amount_paid", order.get("amount_paid"));
            response.put("amount_due", order.get("amount_due"));
            response.put("currency", order.get("currency"));
            response.put("receipt", order.get("receipt"));
            response.put("status", order.get("status"));
            response.put("attempts", order.get("attempts"));
            response.put("created_at", order.get("created_at"));

            return response;
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to fetch order details: " + e.getMessage());
        }
    }
}
