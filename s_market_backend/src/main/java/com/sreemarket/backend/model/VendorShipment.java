package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "vendor_shipments")
public class VendorShipment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String orderId;
    private String customerName;
    private String customerLocation;
    private String carrierName;
    private String status;
    private String shipDate;
    private String estDelivery;

    public VendorShipment() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerLocation() { return customerLocation; }
    public void setCustomerLocation(String customerLocation) { this.customerLocation = customerLocation; }
    public String getCarrierName() { return carrierName; }
    public void setCarrierName(String carrierName) { this.carrierName = carrierName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getShipDate() { return shipDate; }
    public void setShipDate(String shipDate) { this.shipDate = shipDate; }
    public String getEstDelivery() { return estDelivery; }
    public void setEstDelivery(String estDelivery) { this.estDelivery = estDelivery; }
}
