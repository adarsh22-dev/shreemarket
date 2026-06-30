package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "vendor_shipping_rules")
public class VendorShippingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vendor_id", nullable = false)
    private Long vendorId;

    @Column(nullable = false)
    private String name; // e.g., "Standard Shipping", "Express Shipping", "Free Shipping"

    @Column(name = "rule_type", nullable = false)
    private String ruleType; // "flat_rate", "free_shipping", "per_product", "weight_based"

    // Flat rate / base rate amount
    private Double rate;

    // For free shipping threshold
    @Column(name = "min_order_amount")
    private Double minOrderAmount;

    // For per-product shipping: additional charge per product
    @Column(name = "per_product_rate")
    private Double perProductRate;

    // For weight-based: rate per kg
    @Column(name = "rate_per_kg")
    private Double ratePerKg;

    // Maximum weight for this rule (for weight-based)
    @Column(name = "max_weight")
    private Double maxWeight;

    // Estimated delivery days
    @Column(name = "estimated_days_min")
    private Integer estimatedDaysMin;

    @Column(name = "estimated_days_max")
    private Integer estimatedDaysMax;

    // Applicable categories (JSON array of category names, null means all)
    @Column(name = "applicable_categories", columnDefinition = "TEXT")
    private String applicableCategories;

    // Applicable pincodes (JSON array, null means all)
    @Column(columnDefinition = "TEXT")
    private String applicablePincodes;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "updated_at")
    private Long updatedAt;

    public VendorShippingRule() {}

    @PrePersist
    protected void onCreate() {
        createdAt = System.currentTimeMillis();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = System.currentTimeMillis();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRuleType() { return ruleType; }
    public void setRuleType(String ruleType) { this.ruleType = ruleType; }

    public Double getRate() { return rate; }
    public void setRate(Double rate) { this.rate = rate; }

    public Double getMinOrderAmount() { return minOrderAmount; }
    public void setMinOrderAmount(Double minOrderAmount) { this.minOrderAmount = minOrderAmount; }

    public Double getPerProductRate() { return perProductRate; }
    public void setPerProductRate(Double perProductRate) { this.perProductRate = perProductRate; }

    public Double getRatePerKg() { return ratePerKg; }
    public void setRatePerKg(Double ratePerKg) { this.ratePerKg = ratePerKg; }

    public Double getMaxWeight() { return maxWeight; }
    public void setMaxWeight(Double maxWeight) { this.maxWeight = maxWeight; }

    public Integer getEstimatedDaysMin() { return estimatedDaysMin; }
    public void setEstimatedDaysMin(Integer estimatedDaysMin) { this.estimatedDaysMin = estimatedDaysMin; }

    public Integer getEstimatedDaysMax() { return estimatedDaysMax; }
    public void setEstimatedDaysMax(Integer estimatedDaysMax) { this.estimatedDaysMax = estimatedDaysMax; }

    public String getApplicableCategories() { return applicableCategories; }
    public void setApplicableCategories(String applicableCategories) { this.applicableCategories = applicableCategories; }

    public String getApplicablePincodes() { return applicablePincodes; }
    public void setApplicablePincodes(String applicablePincodes) { this.applicablePincodes = applicablePincodes; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Long getCreatedAt() { return createdAt; }
    public Long getUpdatedAt() { return updatedAt; }
}
