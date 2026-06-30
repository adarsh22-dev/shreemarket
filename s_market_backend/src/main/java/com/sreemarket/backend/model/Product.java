package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.Formula;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Basic Information
    private String name;
    private String type; // "single" or "grouped"
    private String category;
    private String subCategory;
    private String brand;
    private String sku;
    private String status; // e.g., "in", "low", "out", "draft"

    @Column(length = 500)
    private String shortDescription;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Pricing & Inventory
    private Double regularPrice;
    private Double discountPrice;
    private Integer initialStock;
    private Boolean supportsWholesale;
    private String wholesaleDiscountType;
    private Double wholesalePrice;
    private Integer minimumWholesaleQuantity;
    private Boolean wholesaleOnly;

    // Shipping, Tax & Policies
    private Double weight;
    private Double length;
    private Double width;
    private Double height;
    private String shippingClass;
    private String taxStatus;
    private String taxClass;
    private String hsnCode;

    // Manufacturer section layout
    private String manufacturerLayout; // "collage", "grid", "slider", "masonry"

    // Instagram feed layout
    private String instagramFeedLayout;

    // Featured product flag
    @Column(name = "is_featured")
    private Boolean isFeatured = false; // "grid" or "slider"

    @Column(columnDefinition = "TEXT")
    private String instagramFeedConfig; // JSON: {"links":{"url":"productName"}}

    // Vendor mapping (store user/vendor ID directly)
    @Column(name = "vendor_id")
    private Long vendorId;

    // Approval status (Pending, Approved, Rejected)
    @Column(name = "approval_status")
    private String approvalStatus = "Pending";

    // Timestamps
    private Long createdAt;
    private Long updatedAt;

    @Formula("(SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.product_id = id)")
    private Double averageRating;

    @Formula("(SELECT COUNT(*) FROM reviews r WHERE r.product_id = id)")
    private Integer reviewCount;

    @Formula("(SELECT COALESCE(SUM(op.quantity), 0) FROM order_products op WHERE op.product_id = id)")
    private Integer bookingCount;

    // Relationships (mapped by the child entity)
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductMedia> media = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductAttribute> attributes = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductVariation> variations = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductTag> tags = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductLinked> linkedProducts = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PolicyDocument> policyDocuments = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<BulkPricingTier> pricingTiers = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = System.currentTimeMillis();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = System.currentTimeMillis();
    }

    // ===== Getters and Setters =====
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSubCategory() {
        return subCategory;
    }

    public void setSubCategory(String subCategory) {
        this.subCategory = subCategory;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getShortDescription() {
        return shortDescription;
    }

    public void setShortDescription(String shortDescription) {
        this.shortDescription = shortDescription;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getRegularPrice() {
        return regularPrice;
    }

    public void setRegularPrice(Double regularPrice) {
        this.regularPrice = regularPrice;
    }

    public Double getDiscountPrice() {
        return discountPrice;
    }

    public void setDiscountPrice(Double discountPrice) {
        this.discountPrice = discountPrice;
    }

    public Integer getInitialStock() {
        return initialStock;
    }

    public void setInitialStock(Integer initialStock) {
        this.initialStock = initialStock;
    }

    public Boolean getSupportsWholesale() {
        return supportsWholesale;
    }

    public void setSupportsWholesale(Boolean supportsWholesale) {
        this.supportsWholesale = supportsWholesale;
    }

    public String getWholesaleDiscountType() {
        return wholesaleDiscountType;
    }

    public void setWholesaleDiscountType(String wholesaleDiscountType) {
        this.wholesaleDiscountType = wholesaleDiscountType;
    }

    public Double getWholesalePrice() {
        return wholesalePrice;
    }

    public void setWholesalePrice(Double wholesalePrice) {
        this.wholesalePrice = wholesalePrice;
    }

    public Integer getMinimumWholesaleQuantity() {
        return minimumWholesaleQuantity;
    }

    public void setMinimumWholesaleQuantity(Integer minimumWholesaleQuantity) {
        this.minimumWholesaleQuantity = minimumWholesaleQuantity;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Double getLength() {
        return length;
    }

    public void setLength(Double length) {
        this.length = length;
    }

    public Double getWidth() {
        return width;
    }

    public void setWidth(Double width) {
        this.width = width;
    }

    public Double getHeight() {
        return height;
    }

    public void setHeight(Double height) {
        this.height = height;
    }

    public String getShippingClass() {
        return shippingClass;
    }

    public void setShippingClass(String shippingClass) {
        this.shippingClass = shippingClass;
    }

    public String getTaxStatus() {
        return taxStatus;
    }

    public void setTaxStatus(String taxStatus) {
        this.taxStatus = taxStatus;
    }

    public String getTaxClass() {
        return taxClass;
    }

    public void setTaxClass(String taxClass) {
        this.taxClass = taxClass;
    }

    public Long getVendorId() {
        return vendorId;
    }

    public void setVendorId(Long vendorId) {
        this.vendorId = vendorId;
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public Long getUpdatedAt() {
        return updatedAt;
    }

    public Double getAverageRating() {
        return averageRating != null ? averageRating : 0.0;
    }

    public Integer getReviewCount() {
        return reviewCount != null ? reviewCount : 0;
    }

    public Integer getBookingCount() {
        return bookingCount != null ? bookingCount : 0;
    }

    public void setBookingCount(Integer bookingCount) {
        this.bookingCount = bookingCount;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getManufacturerLayout() {
        return manufacturerLayout;
    }

    public void setManufacturerLayout(String manufacturerLayout) {
        this.manufacturerLayout = manufacturerLayout;
    }

    public String getInstagramFeedLayout() {
        return instagramFeedLayout;
    }

    public Boolean getIsFeatured() {
        return isFeatured;
    }

    public void setIsFeatured(Boolean isFeatured) {
        this.isFeatured = isFeatured;
    }

    public void setInstagramFeedLayout(String instagramFeedLayout) {
        this.instagramFeedLayout = instagramFeedLayout;
    }

    public String getInstagramFeedConfig() {
        return instagramFeedConfig;
    }

    public void setInstagramFeedConfig(String instagramFeedConfig) {
        this.instagramFeedConfig = instagramFeedConfig;
    }

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public List<ProductMedia> getMedia() {
        return media;
    }

    public List<ProductAttribute> getAttributes() {
        return attributes;
    }

    public List<ProductVariation> getVariations() {
        return variations;
    }

    public List<ProductTag> getTags() {
        return tags;
    }

    public List<ProductLinked> getLinkedProducts() {
        return linkedProducts;
    }

    public List<PolicyDocument> getPolicyDocuments() {
        return policyDocuments;
    }

    public List<BulkPricingTier> getPricingTiers() {
        return pricingTiers;
    }

    public void setPricingTiers(List<BulkPricingTier> pricingTiers) {
        this.pricingTiers = pricingTiers;
    }
}
