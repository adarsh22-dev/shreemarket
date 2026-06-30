package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Caches pincode serviceability results to avoid repeated API calls
 * to external shipping providers. Entries have a TTL and auto-expire.
 */
@Entity
@Table(name = "pincode_serviceability", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"origin_pincode", "destination_pincode", "courier_code"})
})
@NoArgsConstructor
@AllArgsConstructor
public class PincodeServiceability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "origin_pincode", nullable = false, length = 10)
    private String originPincode;

    @Column(name = "destination_pincode", nullable = false, length = 10)
    private String destinationPincode;

    @Column(name = "courier_code", length = 30)
    private String courierCode;

    @Column(nullable = false)
    private Boolean serviceable;

    @Column(name = "estimated_days_min")
    private Integer estimatedDaysMin;

    @Column(name = "estimated_days_max")
    private Integer estimatedDaysMax;

    @Column(name = "shipping_charge")
    private Double shippingCharge;

    @Column(name = "courier_name")
    private String courierName;

    @Column(length = 500)
    private String reason;

    /** Timestamp (epoch ms) when this cache entry was created */
    @Column(name = "cached_at", nullable = false)
    private Long cachedAt;

    /** Timestamp (epoch ms) when this cache entry expires */
    @Column(name = "expires_at", nullable = false)
    private Long expiresAt;

    @Column(name = "is_blocked")
    private Boolean isBlocked = false;

    // ── Getters / Setters ──

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOriginPincode() { return originPincode; }
    public void setOriginPincode(String originPincode) { this.originPincode = originPincode; }

    public String getDestinationPincode() { return destinationPincode; }
    public void setDestinationPincode(String destinationPincode) { this.destinationPincode = destinationPincode; }

    public String getCourierCode() { return courierCode; }
    public void setCourierCode(String courierCode) { this.courierCode = courierCode; }

    public Boolean getServiceable() { return serviceable; }
    public void setServiceable(Boolean serviceable) { this.serviceable = serviceable; }

    public Integer getEstimatedDaysMin() { return estimatedDaysMin; }
    public void setEstimatedDaysMin(Integer estimatedDaysMin) { this.estimatedDaysMin = estimatedDaysMin; }

    public Integer getEstimatedDaysMax() { return estimatedDaysMax; }
    public void setEstimatedDaysMax(Integer estimatedDaysMax) { this.estimatedDaysMax = estimatedDaysMax; }

    public Double getShippingCharge() { return shippingCharge; }
    public void setShippingCharge(Double shippingCharge) { this.shippingCharge = shippingCharge; }

    public String getCourierName() { return courierName; }
    public void setCourierName(String courierName) { this.courierName = courierName; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Long getCachedAt() { return cachedAt; }
    public void setCachedAt(Long cachedAt) { this.cachedAt = cachedAt; }

    public Long getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Long expiresAt) { this.expiresAt = expiresAt; }

    public Boolean getIsBlocked() { return isBlocked; }
    public void setIsBlocked(Boolean isBlocked) { this.isBlocked = isBlocked; }
}
