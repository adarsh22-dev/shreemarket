package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.VendorShippingRule;
import com.sreemarket.backend.repository.VendorShippingRuleRepository;
import com.sreemarket.backend.util.AuthUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor/shipping-rules")
public class VendorShippingRuleController {

    @Autowired
    private VendorShippingRuleRepository shippingRuleRepository;


    /**
     * Get all shipping rules for the authenticated vendor
     */
    @GetMapping
    public ResponseEntity<?> getShippingRules(HttpServletRequest request) {
        try {
            Long vendorId = AuthUtil.getAuthenticatedUserId(request);
            if (vendorId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Not authenticated"));
            }
            List<VendorShippingRule> rules = shippingRuleRepository.findByVendorIdOrderBySortOrderAsc(vendorId);
            return ResponseEntity.ok(rules);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch shipping rules: " + e.getMessage()));
        }
    }

    /**
     * Create a new shipping rule
     */
    @PostMapping
    public ResponseEntity<?> createShippingRule(@RequestBody VendorShippingRule rule, HttpServletRequest request) {
        try {
            Long vendorId = AuthUtil.getAuthenticatedUserId(request);
            if (vendorId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Not authenticated"));
            }
            rule.setVendorId(vendorId);
            if (rule.getIsActive() == null) rule.setIsActive(true);
            if (rule.getSortOrder() == null) rule.setSortOrder(0);

            VendorShippingRule saved = shippingRuleRepository.save(rule);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create shipping rule: " + e.getMessage()));
        }
    }

    /**
     * Update an existing shipping rule
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateShippingRule(@PathVariable Long id, @RequestBody VendorShippingRule updated,
                                                 HttpServletRequest request) {
        try {
            Long vendorId = AuthUtil.getAuthenticatedUserId(request);
            if (vendorId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Not authenticated"));
            }

            VendorShippingRule existing = shippingRuleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Shipping rule not found"));

            if (!existing.getVendorId().equals(vendorId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied"));
            }

            existing.setName(updated.getName());
            existing.setRuleType(updated.getRuleType());
            existing.setRate(updated.getRate());
            existing.setMinOrderAmount(updated.getMinOrderAmount());
            existing.setPerProductRate(updated.getPerProductRate());
            existing.setRatePerKg(updated.getRatePerKg());
            existing.setMaxWeight(updated.getMaxWeight());
            existing.setEstimatedDaysMin(updated.getEstimatedDaysMin());
            existing.setEstimatedDaysMax(updated.getEstimatedDaysMax());
            existing.setApplicableCategories(updated.getApplicableCategories());
            existing.setApplicablePincodes(updated.getApplicablePincodes());
            existing.setIsActive(updated.getIsActive());
            existing.setSortOrder(updated.getSortOrder());

            VendorShippingRule saved = shippingRuleRepository.save(existing);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update shipping rule: " + e.getMessage()));
        }
    }

    /**
     * Delete a shipping rule
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteShippingRule(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long vendorId = AuthUtil.getAuthenticatedUserId(request);
            if (vendorId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Not authenticated"));
            }

            VendorShippingRule existing = shippingRuleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Shipping rule not found"));

            if (!existing.getVendorId().equals(vendorId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied"));
            }

            shippingRuleRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Shipping rule deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete shipping rule: " + e.getMessage()));
        }
    }

    /**
     * Toggle active status
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleShippingRule(@PathVariable Long id, HttpServletRequest request) {
        try {
            Long vendorId = AuthUtil.getAuthenticatedUserId(request);
            if (vendorId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Not authenticated"));
            }

            VendorShippingRule existing = shippingRuleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Shipping rule not found"));

            if (!existing.getVendorId().equals(vendorId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied"));
            }

            existing.setIsActive(!Boolean.TRUE.equals(existing.getIsActive()));
            VendorShippingRule saved = shippingRuleRepository.save(existing);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to toggle shipping rule: " + e.getMessage()));
        }
    }

    /**
     * Public: Get shipping options for a vendor (only active rules)
     * Used by checkout to show available shipping methods and calculate costs
     */
    @GetMapping("/public/{vendorId}")
    public ResponseEntity<?> getPublicShippingOptions(@PathVariable Long vendorId,
                                                       @RequestParam(required = false) Double orderTotal,
                                                       @RequestParam(required = false) String pincode,
                                                       @RequestParam(required = false) Double totalWeight) {
        try {
            List<VendorShippingRule> rules = shippingRuleRepository.findByVendorIdAndIsActiveTrueOrderBySortOrderAsc(vendorId);
            return ResponseEntity.ok(rules);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch shipping options: " + e.getMessage()));
        }
    }

    /**
     * Public: Calculate shipping cost for a vendor based on rules
     */
    @GetMapping("/public/{vendorId}/calculate")
    public ResponseEntity<?> calculateShipping(@PathVariable Long vendorId,
                                                @RequestParam(required = false) Double orderTotal,
                                                @RequestParam(required = false) Integer itemCount,
                                                @RequestParam(required = false) String pincode,
                                                @RequestParam(required = false) Double totalWeight,
                                                @RequestParam(required = false) String category,
                                                @RequestParam(required = false) String ruleId) {
        try {
            List<VendorShippingRule> rules;
            if (ruleId != null) {
                VendorShippingRule specificRule = shippingRuleRepository.findById(Long.parseLong(ruleId))
                        .filter(VendorShippingRule::getIsActive)
                        .orElse(null);
                rules = specificRule != null ? List.of(specificRule) : List.of();
            } else {
                rules = shippingRuleRepository.findByVendorIdAndIsActiveTrueOrderBySortOrderAsc(vendorId);
            }

            double calculatedCost = 0;
            String appliedRule = "No rule applied";
            String estimatedDelivery = null;
            boolean isFree = false;

            if (orderTotal == null) orderTotal = 0.0;
            if (itemCount == null) itemCount = 1;
            if (totalWeight == null) totalWeight = 0.0;

            for (VendorShippingRule rule : rules) {
                // Check category eligibility
                if (rule.getApplicableCategories() != null && category != null) {
                    String[] categories = rule.getApplicableCategories().replaceAll("[\\[\\]\"]", "").split(",");
                    boolean categoryMatch = false;
                    for (String c : categories) {
                        if (c.trim().equalsIgnoreCase(category.trim())) {
                            categoryMatch = true;
                            break;
                        }
                    }
                    if (!categoryMatch) continue;
                }

                // Check pincode eligibility
                if (rule.getApplicablePincodes() != null && pincode != null) {
                    String[] pincodes = rule.getApplicablePincodes().replaceAll("[\\[\\]\"]", "").split(",");
                    boolean pincodeMatch = false;
                    for (String p : pincodes) {
                        if (p.trim().equals(pincode.trim())) {
                            pincodeMatch = true;
                            break;
                        }
                    }
                    if (!pincodeMatch) continue;
                }

                // Check weight eligibility
                if (rule.getMaxWeight() != null && totalWeight > rule.getMaxWeight()) continue;

                switch (rule.getRuleType()) {
                    case "free_shipping":
                        if (rule.getMinOrderAmount() != null && orderTotal >= rule.getMinOrderAmount()) {
                            calculatedCost = 0;
                            appliedRule = rule.getName();
                            isFree = true;
                        }
                        break;
                    case "flat_rate":
                        calculatedCost = rule.getRate() != null ? rule.getRate() : 0;
                        appliedRule = rule.getName();
                        break;
                    case "per_product":
                        double baseRate = rule.getRate() != null ? rule.getRate() : 0;
                        double perProductRate = rule.getPerProductRate() != null ? rule.getPerProductRate() : 0;
                        calculatedCost = baseRate + (perProductRate * Math.max(0, itemCount - 1));
                        appliedRule = rule.getName();
                        break;
                    case "weight_based":
                        calculatedCost = rule.getRatePerKg() != null ? rule.getRatePerKg() * Math.max(1.0, totalWeight) : 0;
                        appliedRule = rule.getName();
                        break;
                }

                if (rule.getEstimatedDaysMin() != null && rule.getEstimatedDaysMax() != null) {
                    estimatedDelivery = rule.getEstimatedDaysMin() + "-" + rule.getEstimatedDaysMax() + " business days";
                }

                // For flat_rate, per_product, weight_based — take first matching rule
                if (!"free_shipping".equals(rule.getRuleType())) break;
            }

            return ResponseEntity.ok(Map.of(
                "cost", calculatedCost,
                "appliedRule", appliedRule,
                "estimatedDelivery", estimatedDelivery,
                "isFree", isFree,
                "availableRules", rules.stream().map(r -> Map.of(
                    "id", r.getId(),
                    "name", r.getName(),
                    "ruleType", r.getRuleType(),
                    "rate", r.getRate(),
                    "minOrderAmount", r.getMinOrderAmount(),
                    "perProductRate", r.getPerProductRate(),
                    "estimatedDaysMin", r.getEstimatedDaysMin(),
                    "estimatedDaysMax", r.getEstimatedDaysMax()
                )).toList()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to calculate shipping: " + e.getMessage()));
        }
    }
}
