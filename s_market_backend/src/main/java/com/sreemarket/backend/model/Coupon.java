package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "coupons")
public class Coupon {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "vendor_id")
    private Long vendorId;
    private String code;
    private String type;
    private Double value;
    private Double minOrder;
    private Double maxDisc;
    private Integer uses;
    private Integer maxUses;
    private String expiry;
    private String categories;
    private String status;
    private Double revenue;
    private Integer orders;

    public Coupon() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Double getValue() { return value; }
    public void setValue(Double value) { this.value = value; }
    public Double getMinOrder() { return minOrder; }
    public void setMinOrder(Double minOrder) { this.minOrder = minOrder; }
    public Double getMaxDisc() { return maxDisc; }
    public void setMaxDisc(Double maxDisc) { this.maxDisc = maxDisc; }
    public Integer getUses() { return uses; }
    public void setUses(Integer uses) { this.uses = uses; }
    public Integer getMaxUses() { return maxUses; }
    public void setMaxUses(Integer maxUses) { this.maxUses = maxUses; }
    public String getExpiry() { return expiry; }
    public void setExpiry(String expiry) { this.expiry = expiry; }
    public String getCategories() { return categories; }
    public void setCategories(String categories) { this.categories = categories; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getRevenue() { return revenue; }
    public void setRevenue(Double revenue) { this.revenue = revenue; }
    public Integer getOrders() { return orders; }
    public void setOrders(Integer orders) { this.orders = orders; }
}
