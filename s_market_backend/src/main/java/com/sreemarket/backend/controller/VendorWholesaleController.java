package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.*;
import com.sreemarket.backend.repository.*;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vendor/wholesale")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorWholesaleController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BulkPricingTierRepository bulkPricingTierRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private WholesalerRepository wholesalerRepository;

    @Autowired
    private WholesalerProductOverrideRepository overrideRepository;

    @Autowired
    private WholesaleRFQRepository rfqRepository;

    private Long getVendorId(HttpServletRequest request) {
        Long vid = AuthUtil.getAuthenticatedUserId(request);
        if (vid == null) return null;
        return vid;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        try {
            List<Product> allProducts = productRepository.findByVendorId(vendorId);
            List<Product> wholesaleProducts = allProducts.stream()
                    .filter(p -> Boolean.TRUE.equals(p.getSupportsWholesale()) || Boolean.TRUE.equals(p.getWholesaleOnly()))
                    .collect(Collectors.toList());

            long totalPricingTiers = 0;
            for (Product p : wholesaleProducts)
                totalPricingTiers += bulkPricingTierRepository.findByProductIdOrderBySortOrderAsc(p.getId()).size();

            List<Order> vendorOrders = orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);
            long wholesaleOrderCount = 0;
            double wholesaleRevenue = 0;
            for (Order o : vendorOrders) {
                if (o.getWholesalerId() != null) {
                    wholesaleOrderCount++;
                    if (o.getTotalAmount() != null) wholesaleRevenue += o.getTotalAmount();
                    continue;
                }
                if (o.getProductQuantities() != null) {
                    for (Long pid : o.getProductQuantities().keySet()) {
                        Optional<Product> prodOpt = productRepository.findById(pid);
                        if (prodOpt.isPresent()) {
                            Product p = prodOpt.get();
                            if (Boolean.TRUE.equals(p.getSupportsWholesale()) || Boolean.TRUE.equals(p.getWholesaleOnly())) {
                                Integer qty = o.getProductQuantities().get(pid);
                                Integer minQty = p.getMinimumWholesaleQuantity();
                                if (minQty != null && qty != null && qty >= minQty) {
                                    wholesaleOrderCount++;
                                    if (o.getTotalAmount() != null) wholesaleRevenue += o.getTotalAmount();
                                }
                                break;
                            }
                        }
                    }
                }
            }

            long pendingRfqCount = rfqRepository.countByVendorIdAndStatus(vendorId, "PENDING");

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalWholesaleProducts", (long) wholesaleProducts.size());
            stats.put("totalProducts", (long) allProducts.size());
            stats.put("totalPricingTiers", totalPricingTiers);
            stats.put("wholesaleOrderCount", wholesaleOrderCount);
            stats.put("wholesaleRevenue", Math.round(wholesaleRevenue * 100.0) / 100.0);
            stats.put("pendingRfqCount", pendingRfqCount);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to load dashboard: " + e.getMessage()));
        }
    }

    @GetMapping("/products")
    public ResponseEntity<?> getWholesaleProducts(HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        try {
            List<Product> allProducts = productRepository.findByVendorId(vendorId);
            List<Map<String, Object>> result = new ArrayList<>();
            for (Product p : allProducts) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", p.getId());
                item.put("name", p.getName());
                item.put("sku", p.getSku());
                item.put("regularPrice", p.getRegularPrice());
                item.put("discountPrice", p.getDiscountPrice());
                item.put("supportsWholesale", p.getSupportsWholesale());
                item.put("wholesalePrice", p.getWholesalePrice());
                item.put("wholesaleDiscountType", p.getWholesaleDiscountType());
                item.put("minimumWholesaleQuantity", p.getMinimumWholesaleQuantity());
                item.put("wholesaleOnly", p.getWholesaleOnly());
                item.put("initialStock", p.getInitialStock());
                item.put("status", p.getStatus());
                item.put("category", p.getCategory());

                List<BulkPricingTier> tiers = bulkPricingTierRepository.findByProductIdOrderBySortOrderAsc(p.getId());
                item.put("pricingTiers", tiers.stream().map(t -> {
                    Map<String, Object> tMap = new HashMap<>();
                    tMap.put("id", t.getId());
                    tMap.put("minQty", t.getMinQuantity());
                    tMap.put("maxQty", t.getMaxQuantity());
                    tMap.put("price", t.getUnitPrice());
                    tMap.put("discountPercent", t.getDiscountValue());
                    return tMap;
                }).collect(Collectors.toList()));

                result.add(item);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch products: " + e.getMessage()));
        }
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateWholesaleProduct(@PathVariable Long id,
                                                     @RequestBody Map<String, Object> body,
                                                     HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        try {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Product not found: " + id));
            if (!vendorId.equals(product.getVendorId()))
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));

            if (body.containsKey("supportsWholesale"))
                product.setSupportsWholesale((Boolean) body.get("supportsWholesale"));
            if (body.containsKey("wholesalePrice")) {
                Object val = body.get("wholesalePrice");
                product.setWholesalePrice(val instanceof Number ? ((Number) val).doubleValue() : null);
            }
            if (body.containsKey("wholesaleDiscountType"))
                product.setWholesaleDiscountType((String) body.get("wholesaleDiscountType"));
            if (body.containsKey("minimumWholesaleQuantity")) {
                Object val = body.get("minimumWholesaleQuantity");
                product.setMinimumWholesaleQuantity(val instanceof Number ? ((Number) val).intValue() : null);
            }
            if (body.containsKey("wholesaleOnly"))
                product.setWholesaleOnly((Boolean) body.get("wholesaleOnly"));

            productRepository.save(product);
            return ResponseEntity.ok(Map.of("success", true, "message", "Wholesale settings updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getWholesaleOrders(HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        try {
            List<Order> vendorOrders = orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);
            List<Map<String, Object>> result = new ArrayList<>();

            for (Order o : vendorOrders) {
                boolean isWholesale = o.getWholesalerId() != null;
                List<Map<String, Object>> wholesaleItems = new ArrayList<>();

                if (o.getProductQuantities() != null) {
                    for (Map.Entry<Long, Integer> entry : o.getProductQuantities().entrySet()) {
                        Long pid = entry.getKey();
                        Integer qty = entry.getValue();
                        Optional<Product> prodOpt = productRepository.findById(pid);
                        if (prodOpt.isPresent()) {
                            Product p = prodOpt.get();
                            Integer minQty = p.getMinimumWholesaleQuantity();
                            if ((Boolean.TRUE.equals(p.getSupportsWholesale()) || Boolean.TRUE.equals(p.getWholesaleOnly()))
                                    && minQty != null && qty >= minQty) {
                                isWholesale = true;
                                Map<String, Object> item = new HashMap<>();
                                item.put("productId", p.getId());
                                item.put("productName", p.getName());
                                item.put("quantity", qty);
                                item.put("minWholesaleQty", minQty);
                                item.put("wholesalePrice", p.getWholesalePrice());
                                wholesaleItems.add(item);
                            }
                        }
                    }
                }

                if (isWholesale) {
                    Map<String, Object> orderMap = new HashMap<>();
                    orderMap.put("orderId", o.getId());
                    orderMap.put("orderNumber", o.getOrderNumber());
                    orderMap.put("customerName", o.getCustomerName());
                    orderMap.put("totalAmount", o.getTotalAmount());
                    orderMap.put("status", o.getStatus());
                    orderMap.put("datePlaced", o.getDatePlaced());
                    orderMap.put("estimatedDelivery", o.getEstimatedDelivery());
                    orderMap.put("items", wholesaleItems);

                    if (o.getWholesalerId() != null) {
                        wholesalerRepository.findById(o.getWholesalerId()).ifPresent(w -> {
                            orderMap.put("wholesalerId", w.getId());
                            orderMap.put("wholesalerName", w.getBusinessName() != null ? w.getBusinessName() : w.getFullName());
                            orderMap.put("wholesalerEmail", w.getEmail());
                            orderMap.put("wholesalerPhone", w.getBusinessPhone() != null ? w.getBusinessPhone() : w.getPhone());
                            orderMap.put("wholesalerGst", w.getGstNumber());
                        });
                    }
                    result.add(orderMap);
                }
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch orders: " + e.getMessage()));
        }
    }

    @GetMapping("/rfqs")
    public ResponseEntity<?> getRfqs(
            @RequestParam(required = false) String status,
            HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        try {
            List<WholesaleRFQ> rfqs;
            if (status != null && !status.isEmpty())
                rfqs = rfqRepository.findByVendorIdAndStatusOrderByCreatedAtDesc(vendorId, status);
            else
                rfqs = rfqRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);

            List<Map<String, Object>> result = new ArrayList<>();
            for (WholesaleRFQ rfq : rfqs) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", rfq.getId());
                m.put("wholesalerId", rfq.getWholesalerId());
                m.put("productId", rfq.getProductId());
                m.put("productName", rfq.getProductName());
                m.put("quantity", rfq.getQuantity());
                m.put("requestedPrice", rfq.getRequestedPrice());
                m.put("notes", rfq.getNotes());
                m.put("status", rfq.getStatus());
                m.put("responseMessage", rfq.getResponseMessage());
                m.put("counterPrice", rfq.getCounterPrice());
                m.put("respondedAt", rfq.getRespondedAt());
                m.put("createdAt", rfq.getCreatedAt());

                wholesalerRepository.findById(rfq.getWholesalerId()).ifPresent(w -> {
                    m.put("wholesalerName", w.getBusinessName() != null ? w.getBusinessName() : w.getFullName());
                    m.put("wholesalerEmail", w.getEmail());
                    m.put("wholesalerPhone", w.getBusinessPhone() != null ? w.getBusinessPhone() : w.getPhone());
                });
                result.add(m);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/rfqs/{id}/respond")
    public ResponseEntity<?> respondToRfq(@PathVariable Long id,
                                           @RequestBody Map<String, Object> body,
                                           HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        try {
            WholesaleRFQ rfq = rfqRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("RFQ not found: " + id));
            if (!vendorId.equals(rfq.getVendorId()))
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));

            String action = (String) body.getOrDefault("action", "ACCEPTED");
            rfq.setStatus(action);
            if (body.containsKey("responseMessage"))
                rfq.setResponseMessage((String) body.get("responseMessage"));
            if (body.containsKey("counterPrice")) {
                Object val = body.get("counterPrice");
                rfq.setCounterPrice(val instanceof Number ? ((Number) val).doubleValue() : null);
            }
            rfq.setRespondedAt(Instant.now().toEpochMilli());
            rfqRepository.save(rfq);
            return ResponseEntity.ok(Map.of("success", true, "message", "RFQ responded"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/overrides")
    public ResponseEntity<?> getOverrides(HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        try {
            List<Product> products = productRepository.findByVendorId(vendorId);
            List<Map<String, Object>> result = new ArrayList<>();
            for (Product p : products) {
                List<WholesalerProductOverride> overrides = overrideRepository.findByProductId(p.getId());
                if (!overrides.isEmpty()) {
                    for (WholesalerProductOverride o : overrides) {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", o.getId());
                        m.put("productId", p.getId());
                        m.put("productName", p.getName());
                        m.put("customPrice", o.getCustomPrice());
                        wholesalerRepository.findById(o.getWholesalerId()).ifPresent(w -> {
                            m.put("wholesalerId", w.getId());
                            m.put("wholesalerName", w.getBusinessName() != null ? w.getBusinessName() : w.getFullName());
                        });
                        result.add(m);
                    }
                }
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/overrides")
    public ResponseEntity<?> setOverride(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        try {
            Long wholesalerId = ((Number) body.get("wholesalerId")).longValue();
            Long productId = ((Number) body.get("productId")).longValue();
            Double customPrice = body.get("customPrice") != null ? ((Number) body.get("customPrice")).doubleValue() : null;

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            if (!vendorId.equals(product.getVendorId()))
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));

            WholesalerProductOverride override = overrideRepository
                    .findByWholesalerIdAndProductId(wholesalerId, productId)
                    .orElse(new WholesalerProductOverride());
            override.setWholesalerId(wholesalerId);
            override.setProductId(productId);
            override.setCustomPrice(customPrice);
            long now = Instant.now().toEpochMilli();
            if (override.getCreatedAt() == null) override.setCreatedAt(now);
            override.setUpdatedAt(now);
            overrideRepository.save(override);
            return ResponseEntity.ok(Map.of("success", true, "message", "Override saved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/overrides/{id}")
    public ResponseEntity<?> deleteOverride(@PathVariable Long id, HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        try {
            overrideRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
