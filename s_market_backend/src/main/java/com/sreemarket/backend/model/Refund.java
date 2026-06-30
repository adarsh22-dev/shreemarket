package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "refunds")
public class Refund {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String customerName;
    private String email;
    private String orderId;
    private String product;
    private Double amount;
    private String status;
    private String reason;
    private String method;
    private String requestedOn;
    private String resolvedOn;
    private String vendor;

    public Refund() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getProduct() { return product; }
    public void setProduct(String product) { this.product = product; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public String getRequestedOn() { return requestedOn; }
    public void setRequestedOn(String requestedOn) { this.requestedOn = requestedOn; }
    public String getResolvedOn() { return resolvedOn; }
    public void setResolvedOn(String resolvedOn) { this.resolvedOn = resolvedOn; }
    public String getVendor() { return vendor; }
    public void setVendor(String vendor) { this.vendor = vendor; }
}
