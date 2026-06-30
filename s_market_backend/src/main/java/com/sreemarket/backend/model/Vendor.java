package com.sreemarket.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import java.util.List;
import java.util.ArrayList;

import jakarta.persistence.Column;

@Entity
@Table(name = "vendors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "vendor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Store> stores = new ArrayList<>();

    @Column(name = "fullname")
    @com.fasterxml.jackson.annotation.JsonProperty("name")
    private String fullName;
    @Column(name = "email_address")
    private String email;
    @Column(name = "phonenumber")
    private String phone;
    @Column(name = "password")
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Column(name = "role_id")
    private Long roleId; // typically 3 for Vendors
    @Column(name = "status")
    private String status;

    @Column(name = "payment_method")
    private String paymentMethod;
    @Column(name = "payment_email")
    @com.fasterxml.jackson.annotation.JsonProperty(value = "paymentIdentifier", access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    private String paymentEmail;

    @Column(name = "terms_and_condition")
    private Boolean agreeTerms;
    @Column(name = "marketplace_policies")
    private Boolean agreePolicies;
    @Column(name = "vendor_rules")
    private Boolean agreeRules;
    @Column(name = "privacy_policy")
    private Boolean agreePrivacy;

    @Column(name = "newsletter")
    private Boolean newsletter;

    @Column(name = "pan")
    private String pan;

    @Column(name = "gst")
    private String gst;

    @Column(name = "rating")
    private Double rating;

    @Column(name = "order_count")
    private Integer orderCount;

    @Column(name = "total_revenue")
    private Double totalRevenue;

    @Column(name = "tier")
    private String tier;

    @Column(name = "kyc_status")
    private String kycStatus;

    @Column(name = "commission_rate")
    private Double commissionRate;

    @Column(columnDefinition = "TEXT")
    private String settings;

    private Long createdAt;
    private Long updatedAt;

    // Custom getters and setters for stores to maintain bidirectional relationship
    public List<Store> getStores() {
        return stores;
    }

    public void setStores(List<Store> stores) {
        this.stores = stores;
        if (stores != null) {
            for (Store store : stores) {
                store.setVendor(this);
            }
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Long getRoleId() {
        return roleId;
    }

    public void setRoleId(Long roleId) {
        this.roleId = roleId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentEmail() {
        return paymentEmail;
    }

    public void setPaymentEmail(String paymentEmail) {
        this.paymentEmail = paymentEmail;
    }

    public Boolean getAgreeTerms() {
        return agreeTerms;
    }

    public void setAgreeTerms(Boolean agreeTerms) {
        this.agreeTerms = agreeTerms;
    }

    public Boolean getAgreePolicies() {
        return agreePolicies;
    }

    public void setAgreePolicies(Boolean agreePolicies) {
        this.agreePolicies = agreePolicies;
    }

    public Boolean getAgreeRules() {
        return agreeRules;
    }

    public void setAgreeRules(Boolean agreeRules) {
        this.agreeRules = agreeRules;
    }

    public Boolean getAgreePrivacy() {
        return agreePrivacy;
    }

    public void setAgreePrivacy(Boolean agreePrivacy) {
        this.agreePrivacy = agreePrivacy;
    }

    public Boolean getNewsletter() {
        return newsletter;
    }

    public void setNewsletter(Boolean newsletter) {
        this.newsletter = newsletter;
    }

    public String getPan() {
        return pan;
    }

    public void setPan(String pan) {
        this.pan = pan;
    }

    public String getGst() {
        return gst;
    }

    public void setGst(String gst) {
        this.gst = gst;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Integer getOrderCount() {
        return orderCount;
    }

    public void setOrderCount(Integer orderCount) {
        this.orderCount = orderCount;
    }

    public Double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(Double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public String getTier() {
        return tier;
    }

    public void setTier(String tier) {
        this.tier = tier;
    }

    public String getKycStatus() {
        return kycStatus;
    }

    public void setKycStatus(String kycStatus) {
        this.kycStatus = kycStatus;
    }

    public Double getCommissionRate() {
        return commissionRate;
    }

    public void setCommissionRate(Double commissionRate) {
        this.commissionRate = commissionRate;
    }

    public String getSettings() {
        return settings;
    }

    public void setSettings(String settings) {
        this.settings = settings;
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    public Long getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Long updatedAt) {
        this.updatedAt = updatedAt;
    }
}
