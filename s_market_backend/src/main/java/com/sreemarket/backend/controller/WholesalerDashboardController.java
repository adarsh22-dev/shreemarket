package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.Wholesaler;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.service.WholesalerService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wholesaler")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class WholesalerDashboardController {

    @Autowired
    private WholesalerService wholesalerService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(HttpServletRequest request) {
        try {
            Long userId = AuthUtil.getAuthenticatedUserId(request);
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            List<Order> orders = orderRepository.findByUserIdOrderByDatePlacedDesc(userId);

            double totalSpent = 0;
            int totalOrders = orders.size();
            long pendingDeliveries = orders.stream()
                    .filter(o -> !"DELIVERED".equalsIgnoreCase(o.getStatus()) && !"CANCELLED".equalsIgnoreCase(o.getStatus()))
                    .count();
            double totalSavings = 0;

            for (Order order : orders) {
                totalSpent += order.getTotalAmount() != null ? order.getTotalAmount() : 0;
                if (order.getProductQuantities() != null) {
                    for (Map.Entry<Long, Integer> entry : order.getProductQuantities().entrySet()) {
                        Optional<Product> productOpt = productRepository.findById(entry.getKey());
                        if (productOpt.isPresent()) {
                            Product p = productOpt.get();
                            if (p.getWholesalePrice() != null && p.getRegularPrice() != null) {
                                totalSavings += (p.getRegularPrice() - p.getWholesalePrice()) * entry.getValue();
                            }
                        }
                    }
                }
            }

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalOrders", totalOrders);
            stats.put("totalSpent", Math.round(totalSpent * 100.0) / 100.0);
            stats.put("pendingDeliveries", pendingDeliveries);
            stats.put("totalSavings", Math.round(totalSavings * 100.0) / 100.0);
            stats.put("recentOrders", orders.stream().limit(5).collect(Collectors.toList()));

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getOrders(HttpServletRequest request) {
        try {
            Long userId = AuthUtil.getAuthenticatedUserId(request);
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            List<Order> orders = orderRepository.findByUserIdOrderByDatePlacedDesc(userId);

            List<Map<String, Object>> enrichedOrders = new ArrayList<>();
            for (Order order : orders) {
                Map<String, Object> enriched = new HashMap<>();
                enriched.put("id", order.getId());
                enriched.put("orderNumber", order.getOrderNumber());
                enriched.put("datePlaced", order.getDatePlaced());
                enriched.put("totalAmount", order.getTotalAmount());
                enriched.put("status", order.getStatus());
                enriched.put("paymentMethod", order.getPaymentMethod());

                List<Map<String, Object>> items = new ArrayList<>();
                if (order.getProductQuantities() != null) {
                    for (Map.Entry<Long, Integer> entry : order.getProductQuantities().entrySet()) {
                        Map<String, Object> item = new HashMap<>();
                        item.put("productId", entry.getKey());
                        item.put("quantity", entry.getValue());
                        productRepository.findById(entry.getKey()).ifPresent(p -> {
                            item.put("productName", p.getName());
                            item.put("wholesalePrice", p.getWholesalePrice());
                            item.put("regularPrice", p.getRegularPrice());
                        });
                        items.add(item);
                    }
                }
                enriched.put("items", items);
                enrichedOrders.add(enriched);
            }

            return ResponseEntity.ok(enrichedOrders);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getOrderDetail(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long userId = AuthUtil.getAuthenticatedUserId(request);
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            if (!order.getUserId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            Map<String, Object> detail = new HashMap<>();
            detail.put("id", order.getId());
            detail.put("orderNumber", order.getOrderNumber());
            detail.put("datePlaced", order.getDatePlaced());
            detail.put("totalAmount", order.getTotalAmount());
            detail.put("taxAmount", order.getTaxAmount());
            detail.put("status", order.getStatus());
            detail.put("paymentMethod", order.getPaymentMethod());
            detail.put("deliveryStatus", order.getDeliveryStatus());
            detail.put("trackingNumber", order.getTrackingNumber());
            detail.put("deliveryPartner", order.getDeliveryPartner());

            List<Map<String, Object>> items = new ArrayList<>();
            if (order.getProductQuantities() != null) {
                for (Map.Entry<Long, Integer> entry : order.getProductQuantities().entrySet()) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("productId", entry.getKey());
                    item.put("quantity", entry.getValue());
                    productRepository.findById(entry.getKey()).ifPresent(p -> {
                        item.put("productName", p.getName());
                        item.put("wholesalePrice", p.getWholesalePrice());
                        item.put("regularPrice", p.getRegularPrice());
                        item.put("image", p.getMedia() != null && !p.getMedia().isEmpty()
                                ? p.getMedia().stream().filter(m -> m.getFileName() != null).findFirst().map(m -> "/uploads/products/" + m.getFileName()).orElse(null)
                                : null);
                    });
                    items.add(item);
                }
            }
            detail.put("items", items);

            return ResponseEntity.ok(detail);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/orders/bulk-inquiry")
    public ResponseEntity<?> submitBulkInquiry(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        try {
            Long userId = AuthUtil.getAuthenticatedUserId(request);
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            String message = (String) body.getOrDefault("message", "");
            String productName = (String) body.getOrDefault("productName", "");
            Integer requestedQuantity = (Integer) body.getOrDefault("requestedQuantity", 0);

            // In a real implementation, this would save to a bulk_inquiries table or send an email
            System.out.println("Bulk inquiry from wholesaler " + userId +
                    ": product=" + productName +
                    ", qty=" + requestedQuantity +
                    ", message=" + message);

            return ResponseEntity.ok(Map.of(
                    "message", "Bulk inquiry submitted successfully. Our team will contact you shortly."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/products")
    public ResponseEntity<?> getPreviouslyOrderedProducts(HttpServletRequest request) {
        try {
            Long userId = AuthUtil.getAuthenticatedUserId(request);
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            List<Order> orders = orderRepository.findByUserIdOrderByDatePlacedDesc(userId);

            Set<Long> productIds = new LinkedHashSet<>();
            for (Order order : orders) {
                if (order.getProductQuantities() != null) {
                    order.getProductQuantities().keySet().stream()
                            .sorted(Collections.reverseOrder())
                            .forEach(productIds::add);
                }
            }

            List<Product> products = productRepository.findAllById(new ArrayList<>(productIds));
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/settings")
    public ResponseEntity<?> getSettings(HttpServletRequest request) {
        try {
            Long userId = AuthUtil.getAuthenticatedUserId(request);
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            Wholesaler wholesaler = wholesalerService.getWholesalerById(userId);
            wholesaler.setPassword(null);
            return ResponseEntity.ok(wholesaler);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(@RequestBody Wholesaler updated, HttpServletRequest request) {
        try {
            Long userId = AuthUtil.getAuthenticatedUserId(request);
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            Wholesaler saved = wholesalerService.updateWholesaler(userId, updated);
            saved.setPassword(null);
            return ResponseEntity.ok(Map.of("message", "Settings updated", "wholesaler", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
