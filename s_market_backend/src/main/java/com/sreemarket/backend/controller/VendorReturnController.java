package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.Notification;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.service.NotificationService;
import com.sreemarket.backend.util.AuthUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vendor/returns")
public class VendorReturnController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationService notificationService;


    /**
     * Get all return-related orders for the authenticated vendor
     */
    @GetMapping
    public ResponseEntity<?> getVendorReturns(HttpServletRequest request) {
        try {
            Long vendorId = AuthUtil.getAuthenticatedUserId(request);
            if (vendorId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Not authenticated"));
            }

            List<Order> vendorOrders = orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);
            List<Order> returnOrders = vendorOrders.stream()
                    .filter(o -> o.getStatus() != null && (
                            o.getStatus().equalsIgnoreCase("RETURN REQUESTED") ||
                            o.getStatus().equalsIgnoreCase("RETURN APPROVED") ||
                            o.getStatus().equalsIgnoreCase("RETURN PROCESSING") ||
                            o.getStatus().equalsIgnoreCase("RETURNED") ||
                            o.getStatus().equalsIgnoreCase("RETURN REJECTED") ||
                            o.getStatus().equalsIgnoreCase("REPLACEMENT REQUESTED") ||
                            o.getStatus().equalsIgnoreCase("REPLACEMENT APPROVED") ||
                            o.getStatus().equalsIgnoreCase("REPLACEMENT SHIPPED") ||
                            o.getStatus().equalsIgnoreCase("REPLACED") ||
                            o.getStatus().equalsIgnoreCase("REPLACEMENT REJECTED")))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(returnOrders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch returns: " + e.getMessage()));
        }
    }

    /**
     * Approve a return request (owner validation against vendorId)
     */
    @PostMapping("/{orderId}/approve")
    public ResponseEntity<?> approveReturn(@PathVariable Long orderId, HttpServletRequest request) {
        return updateReturnStatus(orderId, "RETURN APPROVED", request, "return_approved");
    }

    /**
     * Reject a return request
     */
    @PostMapping("/{orderId}/reject")
    public ResponseEntity<?> rejectReturn(@PathVariable Long orderId, HttpServletRequest request) {
        return updateReturnStatus(orderId, "RETURN REJECTED", request, "return_rejected");
    }

    /**
     * Mark return as being processed (item received, inspection started)
     */
    @PostMapping("/{orderId}/process")
    public ResponseEntity<?> processReturn(@PathVariable Long orderId, HttpServletRequest request) {
        return updateReturnStatus(orderId, "RETURN PROCESSING", request, "return_processing");
    }

    /**
     * Complete the refund (mark as RETURNED)
     */
    @PostMapping("/{orderId}/refund")
    public ResponseEntity<?> completeRefund(@PathVariable Long orderId, HttpServletRequest request) {
        return updateReturnStatus(orderId, "RETURNED", request, "return_refunded");
    }

    /**
     * Approve replacement request
     */
    @PostMapping("/{orderId}/replacement/approve")
    public ResponseEntity<?> approveReplacement(@PathVariable Long orderId, HttpServletRequest request) {
        return updateReturnStatus(orderId, "REPLACEMENT APPROVED", request, "replacement_approved");
    }

    /**
     * Reject replacement request
     */
    @PostMapping("/{orderId}/replacement/reject")
    public ResponseEntity<?> rejectReplacement(@PathVariable Long orderId, HttpServletRequest request) {
        return updateReturnStatus(orderId, "REPLACEMENT REJECTED", request, "replacement_rejected");
    }

    /**
     * Mark replacement as shipped
     */
    @PostMapping("/{orderId}/replacement/ship")
    public ResponseEntity<?> shipReplacement(@PathVariable Long orderId, HttpServletRequest request) {
        return updateReturnStatus(orderId, "REPLACEMENT SHIPPED", request, "replacement_shipped");
    }

    /**
     * Complete replacement
     */
    @PostMapping("/{orderId}/replacement/complete")
    public ResponseEntity<?> completeReplacement(@PathVariable Long orderId, HttpServletRequest request) {
        return updateReturnStatus(orderId, "REPLACED", request, "replacement_completed");
    }

    private ResponseEntity<?> updateReturnStatus(Long orderId, String newStatus, HttpServletRequest request, String notificationType) {
        try {
            Long vendorId = AuthUtil.getAuthenticatedUserId(request);
            if (vendorId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Not authenticated"));
            }

            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            if (!vendorId.equals(order.getVendorId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied: this order does not belong to your store"));
            }

            order.setStatus(newStatus);
            Order updated = orderRepository.save(order);

            return ResponseEntity.ok(Map.of(
                "message", "Return status updated to " + newStatus,
                "order", updated
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update return: " + e.getMessage()));
        }
    }
}
