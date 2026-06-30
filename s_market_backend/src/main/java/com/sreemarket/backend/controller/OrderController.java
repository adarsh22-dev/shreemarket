package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class OrderController {

    @Autowired
    private OrderService orderService;

    private Long getUserIdFromRequest(HttpServletRequest request) {
        Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            // Try to get userId from session attributes
            Object userIdAttr = request.getSession().getAttribute("userId");
            if (userIdAttr instanceof Number) {
                return ((Number) userIdAttr).longValue();
            }
        }
        return null;
    }

    private boolean isAdmin() {
        Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserOrders(@PathVariable Long userId, HttpServletRequest request) {
        Long currentUserId = getUserIdFromRequest(request);
        if (currentUserId == null || (!currentUserId.equals(userId) && !isAdmin())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(orderService.getUserOrders(userId));
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<?> getVendorOrders(@PathVariable Long vendorId, HttpServletRequest request) {
        Long currentUserId = getUserIdFromRequest(request);
        if (currentUserId == null || (!currentUserId.equals(vendorId) && !isAdmin())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(orderService.getVendorOrders(vendorId));
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order, HttpServletRequest request) {
        try {
            Long currentUserId = getUserIdFromRequest(request);
            if (currentUserId != null) {
                order.setUserId(currentUserId);
            }
            Order savedOrder = orderService.createOrder(order);
            return ResponseEntity.ok(savedOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long orderId, HttpServletRequest request) {
        try {
            Long currentUserId = getUserIdFromRequest(request);
            if (currentUserId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }
            Order cancelledOrder = orderService.cancelOrderByCustomer(orderId, currentUserId);
            return ResponseEntity.ok(cancelledOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/bulk-status")
    public ResponseEntity<?> bulkUpdateOrderStatus(@RequestBody Map<String, Object> request, HttpServletRequest httpRequest) {
        try {
            // Extract vendorId from session
            Object vendorIdAttr = httpRequest.getSession().getAttribute("userId");
            if (vendorIdAttr == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }
            Long vendorId = ((Number) vendorIdAttr).longValue();

            @SuppressWarnings("unchecked")
            List<Long> orderIds = ((List<Number>) request.get("orderIds"))
                .stream().map(Number::longValue).collect(java.util.stream.Collectors.toList());
            String newStatus = (String) request.get("status");

            if (orderIds == null || orderIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "orderIds is required"));
            }
            if (newStatus == null || newStatus.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
            }

            Map<String, Object> result = orderService.bulkUpdateOrderStatus(orderIds, newStatus, vendorId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> statusUpdate, HttpServletRequest request) {
        try {
            Long currentUserId = getUserIdFromRequest(request);
            if (currentUserId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            // Allow if admin OR if the authenticated user is the vendor of this order
            Order order = orderService.getOrderById(id);
            boolean isVendor = order.getVendorId() != null && order.getVendorId().equals(currentUserId);
            if (!isAdmin() && !isVendor) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            String newStatus = statusUpdate.get("status");
            if (newStatus == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            Order updatedOrder = orderService.updateOrderStatus(id, newStatus);
            return ResponseEntity.ok(updatedOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/mock/{userId}")
    public ResponseEntity<?> createMockOrders(@PathVariable Long userId, HttpServletRequest request) {
        try {
            Long currentUserId = getUserIdFromRequest(request);
            if (currentUserId == null || (!currentUserId.equals(userId) && !isAdmin())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            orderService.generateMockOrders(userId);
            return ResponseEntity.ok(Map.of("message", "Mock orders generated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/track/{orderNumber}")
    public ResponseEntity<?> trackOrder(@PathVariable String orderNumber) {
        try {
            Order order = orderService.getOrderByOrderNumber(orderNumber);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", order.getId());
            result.put("orderNumber", order.getOrderNumber());
            result.put("status", order.getStatus());
            result.put("customerName", order.getCustomerName());
            result.put("totalAmount", order.getTotalAmount());
            result.put("datePlaced", order.getDatePlaced());
            result.put("estimatedDelivery", order.getEstimatedDelivery());
            result.put("deliveryLocation", order.getDeliveryLocation());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", "Order not found: " + orderNumber));
        }
    }

    @GetMapping("/lookup/{id}")
    public ResponseEntity<?> lookupOrderById(@PathVariable Long id) {
        try {
            Order order = orderService.getOrderById(id);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", order.getId());
            result.put("orderNumber", order.getOrderNumber());
            result.put("status", order.getStatus());
            result.put("customerName", order.getCustomerName());
            result.put("totalAmount", order.getTotalAmount());
            result.put("datePlaced", order.getDatePlaced());
            result.put("estimatedDelivery", order.getEstimatedDelivery());
            result.put("deliveryLocation", order.getDeliveryLocation());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", "Order not found with id: " + id));
        }
    }

    @PostMapping(value = "/{orderId}/return", consumes = { "multipart/form-data" })
    public ResponseEntity<?> submitReturnRequest(
            @PathVariable Long orderId,
            @RequestParam("reason") String reason,
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {
        try {
            Order updatedOrder = orderService.submitReturnRequest(orderId, reason, images);
            return ResponseEntity.ok(updatedOrder);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to upload images"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
