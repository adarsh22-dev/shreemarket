package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Notification;
import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.service.NotificationService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vendor/abandoned-orders")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorAbandonedOrdersController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getAbandonedOrders(HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        List<Order> allVendorOrders = orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);
        long threeDaysAgo = System.currentTimeMillis() - (86400000L * 3);

        List<Map<String, Object>> abandoned = allVendorOrders.stream()
                .filter(o -> "PROCESSING".equalsIgnoreCase(o.getStatus()) && o.getDatePlaced() < threeDaysAgo)
                .map(o -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", o.getId());
                    m.put("orderNumber", o.getOrderNumber());
                    m.put("customerName", o.getCustomerName());
                    m.put("totalAmount", o.getTotalAmount());
                    m.put("datePlaced", o.getDatePlaced());
                    m.put("daysSinceOrder", (System.currentTimeMillis() - o.getDatePlaced()) / 86400000);
                    m.put("status", o.getStatus());
                    m.put("deliveryLocation", o.getDeliveryLocation());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("abandonedOrders", abandoned);
        result.put("count", abandoned.size());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{orderId}/follow-up")
    public ResponseEntity<?> sendFollowUp(@PathVariable Long orderId, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!vendorId.equals(order.getVendorId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        Notification notification = new Notification();
        notification.setVendorId(vendorId);
        notification.setTitle("Follow-up Sent");
        notification.setMessage("Follow-up reminder sent for order " + order.getOrderNumber() + " to " + order.getCustomerName());
        notification.setType("ORDER");
        notification.setReferenceId(orderId);
        notificationService.createNotification(notification);

        return ResponseEntity.ok(Map.of("success", true, "message", "Follow-up sent for order " + order.getOrderNumber()));
    }

    @PostMapping("/bulk-follow-up")
    public ResponseEntity<?> sendBulkFollowUp(@RequestBody Map<String, List<Long>> body, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        List<Long> orderIds = body.get("orderIds");
        if (orderIds == null || orderIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "orderIds is required"));
        }

        int sent = 0;
        for (Long orderId : orderIds) {
            try {
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order != null && vendorId.equals(order.getVendorId())) {
                    Notification notification = new Notification();
                    notification.setVendorId(vendorId);
                    notification.setTitle("Follow-up Sent");
                    notification.setMessage("Bulk follow-up sent for order " + order.getOrderNumber());
                    notification.setType("ORDER");
                    notification.setReferenceId(orderId);
                    notificationService.createNotification(notification);
                    sent++;
                }
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(Map.of("success", true, "sent", sent));
    }
}
