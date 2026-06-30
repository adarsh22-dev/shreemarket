package com.sreemarket.backend.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response DTO for pincode serviceability checks.
 * Supports single-product and multi-vendor cart flows.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PincodeValidationResponse {

    /** Overall serviceability status */
    private boolean serviceable;

    /** Estimated delivery date range (e.g., "Jun 28 - Jul 2") */
    private String estimatedDelivery;

    /** List of available courier partners with details */
    private List<CourierOption> courierOptions;

    /** Shipping charges (total for the vendor/product group) */
    private Double shippingCharges;

    /** User-friendly message */
    private String message;

    /** If service is unavailable, reason for failure */
    private String reason;

    /** Vendor-level breakdown for multi-vendor carts */
    private List<VendorShippingStatus> vendorBreakdown;

    /** The pincode that was checked */
    private String destinationPincode;

    // ── Constructors ──

    public PincodeValidationResponse() {}

    public PincodeValidationResponse(boolean serviceable, String message) {
        this.serviceable = serviceable;
        this.message = message;
    }

    // ── Nested DTOs ──

    /** Details about a courier option */
    public static class CourierOption {
        private String courierCode;
        private String courierName;
        private Integer estimatedDaysMin;
        private Integer estimatedDaysMax;
        private Double charge;
        private Boolean codAvailable;

        public CourierOption() {}

        public CourierOption(String courierCode, String courierName,
                             Integer estimatedDaysMin, Integer estimatedDaysMax,
                             Double charge, Boolean codAvailable) {
            this.courierCode = courierCode;
            this.courierName = courierName;
            this.estimatedDaysMin = estimatedDaysMin;
            this.estimatedDaysMax = estimatedDaysMax;
            this.charge = charge;
            this.codAvailable = codAvailable;
        }

        public String getCourierCode() { return courierCode; }
        public void setCourierCode(String courierCode) { this.courierCode = courierCode; }

        public String getCourierName() { return courierName; }
        public void setCourierName(String courierName) { this.courierName = courierName; }

        public Integer getEstimatedDaysMin() { return estimatedDaysMin; }
        public void setEstimatedDaysMin(Integer estimatedDaysMin) { this.estimatedDaysMin = estimatedDaysMin; }

        public Integer getEstimatedDaysMax() { return estimatedDaysMax; }
        public void setEstimatedDaysMax(Integer estimatedDaysMax) { this.estimatedDaysMax = estimatedDaysMax; }

        public Double getCharge() { return charge; }
        public void setCharge(Double charge) { this.charge = charge; }

        public Boolean getCodAvailable() { return codAvailable; }
        public void setCodAvailable(Boolean codAvailable) { this.codAvailable = codAvailable; }
    }

    /** Per-vendor shipping status for multi-vendor carts */
    public static class VendorShippingStatus {
        private Long vendorId;
        private String vendorName;
        private String vendorPincode;
        private List<Long> productIds;
        private boolean serviceable;
        private String message;
        private Double shippingCharges;
        private String estimatedDelivery;
        private List<CourierOption> courierOptions;

        public VendorShippingStatus() {}

        public Long getVendorId() { return vendorId; }
        public void setVendorId(Long vendorId) { this.vendorId = vendorId; }

        public String getVendorName() { return vendorName; }
        public void setVendorName(String vendorName) { this.vendorName = vendorName; }

        public String getVendorPincode() { return vendorPincode; }
        public void setVendorPincode(String vendorPincode) { this.vendorPincode = vendorPincode; }

        public List<Long> getProductIds() { return productIds; }
        public void setProductIds(List<Long> productIds) { this.productIds = productIds; }

        public boolean isServiceable() { return serviceable; }
        public void setServiceable(boolean serviceable) { this.serviceable = serviceable; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public Double getShippingCharges() { return shippingCharges; }
        public void setShippingCharges(Double shippingCharges) { this.shippingCharges = shippingCharges; }

        public String getEstimatedDelivery() { return estimatedDelivery; }
        public void setEstimatedDelivery(String estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }

        public List<CourierOption> getCourierOptions() { return courierOptions; }
        public void setCourierOptions(List<CourierOption> courierOptions) { this.courierOptions = courierOptions; }
    }

    // ── Getters / Setters ──

    public boolean isServiceable() { return serviceable; }
    public void setServiceable(boolean serviceable) { this.serviceable = serviceable; }

    public String getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(String estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }

    public List<CourierOption> getCourierOptions() { return courierOptions; }
    public void setCourierOptions(List<CourierOption> courierOptions) { this.courierOptions = courierOptions; }

    public Double getShippingCharges() { return shippingCharges; }
    public void setShippingCharges(Double shippingCharges) { this.shippingCharges = shippingCharges; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public List<VendorShippingStatus> getVendorBreakdown() { return vendorBreakdown; }
    public void setVendorBreakdown(List<VendorShippingStatus> vendorBreakdown) { this.vendorBreakdown = vendorBreakdown; }

    public String getDestinationPincode() { return destinationPincode; }
    public void setDestinationPincode(String destinationPincode) { this.destinationPincode = destinationPincode; }
}
