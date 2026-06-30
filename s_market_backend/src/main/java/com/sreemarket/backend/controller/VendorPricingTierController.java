package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.BulkPricingTier;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.repository.BulkPricingTierRepository;
import com.sreemarket.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class VendorPricingTierController {

    @Autowired
    private BulkPricingTierRepository pricingTierRepository;

    @Autowired
    private ProductService productService;

    /**
     * Vendor: Get pricing tiers for a product
     */
    @GetMapping("/vendor/products/{productId}/pricing-tiers")
    public ResponseEntity<?> getPricingTiers(@PathVariable Long productId) {
        try {
            List<BulkPricingTier> tiers = pricingTierRepository.findByProductIdOrderBySortOrderAsc(productId);
            return ResponseEntity.ok(tiers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch pricing tiers: " + e.getMessage()));
        }
    }

    /**
     * Vendor: Save all pricing tiers for a product (replaces all existing tiers)
     */
    @PutMapping("/vendor/products/{productId}/pricing-tiers")
    public ResponseEntity<?> savePricingTiers(
            @PathVariable Long productId,
            @RequestBody List<Map<String, Object>> tiersData) {
        try {
            Product product = productService.getProductById(productId);

            // Delete existing tiers
            pricingTierRepository.deleteByProductId(productId);

            // Create new tiers
            List<BulkPricingTier> tiers = new ArrayList<>();
            if (tiersData != null) {
                for (int i = 0; i < tiersData.size(); i++) {
                    Map<String, Object> data = tiersData.get(i);
                    BulkPricingTier tier = new BulkPricingTier();
                    tier.setProduct(product);
                    tier.setMinQuantity(toInteger(data.get("minQuantity")));
                    tier.setMaxQuantity(toInteger(data.get("maxQuantity")));
                    tier.setUnitPrice(toDouble(data.get("unitPrice")));
                    tier.setDiscountType((String) data.get("discountType"));
                    tier.setDiscountValue(toDouble(data.get("discountValue")));
                    tier.setSortOrder(i);
                    tiers.add(tier);
                }
                pricingTierRepository.saveAll(tiers);
            }

            return ResponseEntity.ok(tiers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save pricing tiers: " + e.getMessage()));
        }
    }

    /**
     * Public: Calculate tiered price for a product at a given quantity
     */
    @GetMapping("/products/{productId}/price-for-quantity")
    public ResponseEntity<?> getPriceForQuantity(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") int quantity) {
        try {
            Product product = productService.getApprovedProductById(productId);
            List<BulkPricingTier> tiers = pricingTierRepository.findByProductIdOrderBySortOrderAsc(productId);

            double basePrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getRegularPrice();
            double unitPrice = basePrice;
            double totalPrice = basePrice * quantity;
            BulkPricingTier appliedTier = null;

            if (tiers != null && !tiers.isEmpty()) {
                for (BulkPricingTier tier : tiers) {
                    if (quantity >= tier.getMinQuantity()) {
                        if (tier.getMaxQuantity() == null || quantity <= tier.getMaxQuantity()) {
                            appliedTier = tier;
                            break;
                        }
                    }
                }

                if (appliedTier != null) {
                    if (appliedTier.getUnitPrice() != null) {
                        unitPrice = appliedTier.getUnitPrice();
                    } else if (appliedTier.getDiscountType() != null && appliedTier.getDiscountValue() != null) {
                        if ("percentage".equals(appliedTier.getDiscountType())) {
                            unitPrice = basePrice * (1 - appliedTier.getDiscountValue() / 100.0);
                        } else {
                            unitPrice = basePrice - appliedTier.getDiscountValue();
                        }
                        if (unitPrice < 0) unitPrice = 0;
                    }
                    totalPrice = unitPrice * quantity;
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("productId", productId);
            result.put("productName", product.getName());
            result.put("quantity", quantity);
            result.put("baseUnitPrice", basePrice);
            result.put("unitPrice", unitPrice);
            result.put("totalPrice", totalPrice);
            result.put("savingsPerUnit", basePrice - unitPrice);
            result.put("totalSavings", (basePrice - unitPrice) * quantity);
            result.put("appliedTier", appliedTier != null ? Map.of(
                "minQuantity", appliedTier.getMinQuantity(),
                "maxQuantity", appliedTier.getMaxQuantity(),
                "unitPrice", appliedTier.getUnitPrice(),
                "discountType", appliedTier.getDiscountType(),
                "discountValue", appliedTier.getDiscountValue()
            ) : null);
            result.put("availableTiers", tiers.stream().map(t -> Map.of(
                "minQuantity", t.getMinQuantity(),
                "maxQuantity", t.getMaxQuantity(),
                "unitPrice", t.getUnitPrice(),
                "discountType", t.getDiscountType(),
                "discountValue", t.getDiscountValue()
            )).collect(Collectors.toList()));

            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to calculate price: " + e.getMessage()));
        }
    }

    private Integer toInteger(Object val) {
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(val.toString()); } catch (Exception e) { return null; }
    }

    private Double toDouble(Object val) {
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).doubleValue();
        try { return Double.parseDouble(val.toString()); } catch (Exception e) { return null; }
    }
}
