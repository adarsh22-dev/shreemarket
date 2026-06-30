package com.sreemarket.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "stock_movements", indexes = {
    @Index(name = "idx_stock_product", columnList = "productId"),
    @Index(name = "idx_stock_vendor", columnList = "vendorId"),
    @Index(name = "idx_stock_type", columnList = "type"),
    @Index(name = "idx_stock_created", columnList = "createdAt")
})
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The product whose stock changed */
    private Long productId;
    private String productName;
    private String productSku;
    private String productCategory;

    /** Vendor who owns the product */
    private Long vendorId;

    /**
     * Type of movement:
     * - IN: Stock added (purchase order, return, adjustment +)
     * - OUT: Stock removed (sale, damage, adjustment -)
     * - ADJUSTMENT: Manual stock correction
     */
    private String type;

    /** Quantity change (positive for IN, positive for OUT — sign indicates direction) */
    private Integer quantity;

    /** Stock levels before and after the movement */
    private Integer previousStock;
    private Integer newStock;

    /** Reference document (order number, purchase order, etc.) */
    private String reference;

    /** Who performed this action */
    private String createdBy;

    /** When this movement occurred (epoch ms) */
    private Long createdAt;

    /** Additional notes */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String notes;

    public StockMovement() {}

    public StockMovement(Long productId, String productName, String productSku, String productCategory,
                         Long vendorId, String type, Integer quantity,
                         Integer previousStock, Integer newStock,
                         String reference, String createdBy, String notes) {
        this.productId = productId;
        this.productName = productName;
        this.productSku = productSku;
        this.productCategory = productCategory;
        this.vendorId = vendorId;
        this.type = type;
        this.quantity = quantity;
        this.previousStock = previousStock;
        this.newStock = newStock;
        this.reference = reference;
        this.createdBy = createdBy;
        this.createdAt = System.currentTimeMillis();
        this.notes = notes;
    }

    // ── Getters & Setters ──

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductSku() { return productSku; }
    public void setProductSku(String productSku) { this.productSku = productSku; }

    public String getProductCategory() { return productCategory; }
    public void setProductCategory(String productCategory) { this.productCategory = productCategory; }

    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getPreviousStock() { return previousStock; }
    public void setPreviousStock(Integer previousStock) { this.previousStock = previousStock; }

    public Integer getNewStock() { return newStock; }
    public void setNewStock(Integer newStock) { this.newStock = newStock; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
