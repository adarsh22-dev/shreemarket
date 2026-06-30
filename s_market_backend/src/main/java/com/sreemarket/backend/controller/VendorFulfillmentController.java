package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.OrderFulfillment;
import com.sreemarket.backend.repository.OrderFulfillmentRepository;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.service.NotificationService;
import com.sreemarket.backend.model.Notification;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/vendor/fulfillments")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorFulfillmentController {

    @Autowired
    private OrderFulfillmentRepository orderFulfillmentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getFulfillments(HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        return ResponseEntity.ok(orderFulfillmentRepository.findByVendorIdOrderByCreatedAtDesc(vendorId));
    }

    @PostMapping
    public ResponseEntity<?> createFulfillment(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        Long orderId = body.get("orderId") instanceof Number ? ((Number) body.get("orderId")).longValue() : null;
        String productQuantitiesJson = (String) body.get("productQuantitiesJson");
        String trackingNumber = (String) body.getOrDefault("trackingNumber", "");
        String carrierName = (String) body.getOrDefault("carrierName", "");

        if (orderId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "orderId is required"));
        }

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null || !vendorId.equals(order.getVendorId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        OrderFulfillment fulfillment = new OrderFulfillment();
        fulfillment.setOrderId(orderId);
        fulfillment.setVendorId(vendorId);
        fulfillment.setProductQuantitiesJson(productQuantitiesJson);
        fulfillment.setStatus("SHIPPED");
        fulfillment.setTrackingNumber(trackingNumber);
        fulfillment.setCarrierName(carrierName);
        fulfillment.setCreatedAt(System.currentTimeMillis());
        fulfillment.setUpdatedAt(System.currentTimeMillis());
        orderFulfillmentRepository.save(fulfillment);

        Notification notification = new Notification();
        notification.setVendorId(vendorId);
        notification.setTitle("Partial Fulfillment Created");
        notification.setMessage("Partial shipment created for order " + order.getOrderNumber());
        notification.setType("ORDER");
        notificationService.createNotification(notification);

        return ResponseEntity.ok(Map.of("success", true, "fulfillment", fulfillment));
    }
}
