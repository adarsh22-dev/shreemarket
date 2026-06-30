package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "shipping_labels")
public class ShippingLabel {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "vendor_id")
    private Long vendorId;

    @Column(name = "awb_number")
    private String awbNumber; // Air Waybill / tracking number from carrier

    @Column(name = "carrier_code")
    private String carrierCode; // e.g., "shiprocket", "delhivery"

    @Column(name = "carrier_name")
    private String carrierName;

    @Column(name = "label_url")
    private String labelUrl; // URL to the generated PDF label

    @Column(name = "manifest_url")
    private String manifestUrl; // URL to manifest document (for pickup)

    @Column(name = "status")
    private String status; // PENDING, GENERATED, MANIFESTED, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED

    @Column(name = "shipment_cost")
    private Double shipmentCost;

    @Column(name = "estimated_delivery")
    private String estimatedDelivery;

    @Column(name = "pickup_scheduled")
    private Boolean pickupScheduled = false;

    @Column(name = "pickup_date")
    private String pickupDate;

    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "updated_at")
    private Long updatedAt;

    @Column(columnDefinition = "TEXT")
    private String responseData; // Raw API response from carrier for debugging

    public ShippingLabel() {}

    @PrePersist
    protected void onCreate() {
        createdAt = System.currentTimeMillis();
        updatedAt = System.currentTimeMillis();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = System.currentTimeMillis();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }

    public String getAwbNumber() { return awbNumber; }
    public void setAwbNumber(String awbNumber) { this.awbNumber = awbNumber; }

    public String getCarrierCode() { return carrierCode; }
    public void setCarrierCode(String carrierCode) { this.carrierCode = carrierCode; }

    public String getCarrierName() { return carrierName; }
    public void setCarrierName(String carrierName) { this.carrierName = carrierName; }

    public String getLabelUrl() { return labelUrl; }
    public void setLabelUrl(String labelUrl) { this.labelUrl = labelUrl; }

    public String getManifestUrl() { return manifestUrl; }
    public void setManifestUrl(String manifestUrl) { this.manifestUrl = manifestUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getShipmentCost() { return shipmentCost; }
    public void setShipmentCost(Double shipmentCost) { this.shipmentCost = shipmentCost; }

    public String getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(String estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }

    public Boolean getPickupScheduled() { return pickupScheduled; }
    public void setPickupScheduled(Boolean pickupScheduled) { this.pickupScheduled = pickupScheduled; }

    public String getPickupDate() { return pickupDate; }
    public void setPickupDate(String pickupDate) { this.pickupDate = pickupDate; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }

    public String getResponseData() { return responseData; }
    public void setResponseData(String responseData) { this.responseData = responseData; }
}
