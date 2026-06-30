package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderNumber;

    private Long userId;

    private Long datePlaced;

    private Double totalAmount;

    private Double taxAmount;
    private Double cgst;
    private Double sgst;
    private Double igst;
    private Double cess;
    private Double taxRate;
    private Double tcsAmount;

    private String status;

    @ElementCollection
    @CollectionTable(name = "order_images", joinColumns = @JoinColumn(name = "order_id"))
    @Column(name = "image_url")
    private List<String> images;

    private Integer additionalItems;

    @Column(length = 1000)
    private String impactNote;

    @Column(length = 1000)
    private String returnReason;

    @ElementCollection
    @CollectionTable(name = "order_return_images", joinColumns = @JoinColumn(name = "order_id"))
    @Column(name = "image_url")
    private List<String> returnImages;

    @ElementCollection
    @CollectionTable(name = "order_products", joinColumns = @JoinColumn(name = "order_id"))
    @MapKeyColumn(name = "product_id")
    @Column(name = "quantity")
    private Map<Long, Integer> productQuantities;

    @Column(name = "vendor_id")
    private Long vendorId;

    private String customerName;
    private String deliveryLocation;
    private String estimatedDelivery;

    private String paymentId;

    private String paymentMethod;

    @Column(name = "tracking_number")
    private String trackingNumber;

    @Column(name = "delivery_partner")
    private String deliveryPartner;

    @Column(name = "delivery_status")
    private String deliveryStatus;

    @Column(name = "delivery_updates", columnDefinition = "TEXT")
    private String deliveryUpdates; // JSON array of {status, timestamp, location}

    /** Epoch ms when order was marked DELIVERED (set automatically) */
    private Long deliveredAt;

    /** Lock period in days before vendor can withdraw earnings (default 90) */
    private Integer withdrawalLockDays;

    /** Wholesaler ID if this order was placed by a registered wholesaler */
    @Column(name = "wholesaler_id")
    private Long wholesalerId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getDatePlaced() {
        return datePlaced;
    }

    public void setDatePlaced(Long datePlaced) {
        this.datePlaced = datePlaced;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Double getTaxAmount() { return taxAmount; }
    public void setTaxAmount(Double taxAmount) { this.taxAmount = taxAmount; }

    public Double getCgst() { return cgst; }
    public void setCgst(Double cgst) { this.cgst = cgst; }

    public Double getSgst() { return sgst; }
    public void setSgst(Double sgst) { this.sgst = sgst; }

    public Double getIgst() { return igst; }
    public void setIgst(Double igst) { this.igst = igst; }

    public Double getCess() { return cess; }
    public void setCess(Double cess) { this.cess = cess; }

    public Double getTaxRate() { return taxRate; }
    public void setTaxRate(Double taxRate) { this.taxRate = taxRate; }

    public Double getTcsAmount() { return tcsAmount; }
    public void setTcsAmount(Double tcsAmount) { this.tcsAmount = tcsAmount; }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public Integer getAdditionalItems() {
        return additionalItems;
    }

    public void setAdditionalItems(Integer additionalItems) {
        this.additionalItems = additionalItems;
    }

    public Map<Long, Integer> getProductQuantities() {
        return productQuantities;
    }

    public void setProductQuantities(Map<Long, Integer> productQuantities) {
        this.productQuantities = productQuantities;
    }

    public String getImpactNote() {
        return impactNote;
    }

    public void setImpactNote(String impactNote) {
        this.impactNote = impactNote;
    }

    public String getReturnReason() {
        return returnReason;
    }

    public void setReturnReason(String returnReason) {
        this.returnReason = returnReason;
    }

    public List<String> getReturnImages() {
        return returnImages;
    }

    public void setReturnImages(List<String> returnImages) {
        this.returnImages = returnImages;
    }

    public Long getVendorId() {
        return vendorId;
    }

    public void setVendorId(Long vendorId) {
        this.vendorId = vendorId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getDeliveryLocation() {
        return deliveryLocation;
    }

    public void setDeliveryLocation(String deliveryLocation) {
        this.deliveryLocation = deliveryLocation;
    }

    public String getEstimatedDelivery() {
        return estimatedDelivery;
    }

    public void setEstimatedDelivery(String estimatedDelivery) {
        this.estimatedDelivery = estimatedDelivery;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public String getDeliveryPartner() { return deliveryPartner; }
    public void setDeliveryPartner(String deliveryPartner) { this.deliveryPartner = deliveryPartner; }

    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }

    public String getDeliveryUpdates() { return deliveryUpdates; }
    public void setDeliveryUpdates(String deliveryUpdates) { this.deliveryUpdates = deliveryUpdates; }

    public Long getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(Long deliveredAt) { this.deliveredAt = deliveredAt; }

    public Integer getWithdrawalLockDays() { return withdrawalLockDays; }
    public void setWithdrawalLockDays(Integer withdrawalLockDays) { this.withdrawalLockDays = withdrawalLockDays; }

    public Long getWholesalerId() { return wholesalerId; }
    public void setWholesalerId(Long wholesalerId) { this.wholesalerId = wholesalerId; }
}
