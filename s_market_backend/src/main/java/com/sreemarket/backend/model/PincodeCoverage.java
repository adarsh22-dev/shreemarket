package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Maps delivery/courier partners to specific pincodes they service,
 * along with zone classification, estimated delivery days, and charges.
 */
@Entity
@Table(name = "pincode_coverage", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"courier_code", "pincode"})
})
@NoArgsConstructor
@AllArgsConstructor
public class PincodeCoverage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "courier_code", nullable = false, length = 30)
    private String courierCode;

    @Column(name = "courier_name", length = 100)
    private String courierName;

    @Column(nullable = false, length = 10)
    private String pincode;

    /** metro / urban / semi-urban / rural / remote */
    @Column(name = "zone_type", length = 20)
    private String zoneType;

    @Column(name = "estimated_days_min")
    private Integer estimatedDaysMin;

    @Column(name = "estimated_days_max")
    private Integer estimatedDaysMax;

    @Column(name = "base_charge")
    private Double baseCharge;

    @Column(name = "cod_available")
    private Boolean codAvailable = true;

    /** Is this pincode actively serviced by this courier? */
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_blocked")
    private Boolean isBlocked = false;

    /** Reason if blocked (e.g., "Restricted zone", "Service temporarily suspended") */
    @Column(length = 300)
    private String blockReason;

    @Column(name = "updated_at")
    private Long updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = System.currentTimeMillis();
    }

    // ── Getters / Setters ──

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCourierCode() { return courierCode; }
    public void setCourierCode(String courierCode) { this.courierCode = courierCode; }

    public String getCourierName() { return courierName; }
    public void setCourierName(String courierName) { this.courierName = courierName; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getZoneType() { return zoneType; }
    public void setZoneType(String zoneType) { this.zoneType = zoneType; }

    public Integer getEstimatedDaysMin() { return estimatedDaysMin; }
    public void setEstimatedDaysMin(Integer estimatedDaysMin) { this.estimatedDaysMin = estimatedDaysMin; }

    public Integer getEstimatedDaysMax() { return estimatedDaysMax; }
    public void setEstimatedDaysMax(Integer estimatedDaysMax) { this.estimatedDaysMax = estimatedDaysMax; }

    public Double getBaseCharge() { return baseCharge; }
    public void setBaseCharge(Double baseCharge) { this.baseCharge = baseCharge; }

    public Boolean getCodAvailable() { return codAvailable; }
    public void setCodAvailable(Boolean codAvailable) { this.codAvailable = codAvailable; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Boolean getIsBlocked() { return isBlocked; }
    public void setIsBlocked(Boolean isBlocked) { this.isBlocked = isBlocked; }

    public String getBlockReason() { return blockReason; }
    public void setBlockReason(String blockReason) { this.blockReason = blockReason; }

    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }
}
