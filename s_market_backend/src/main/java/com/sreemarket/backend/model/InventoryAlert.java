package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "inventory_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Product ID this alert is about */
    private Long productId;

    /** Product name for quick display */
    private String productName;

    /** Product SKU */
    private String productSku;

    /** Product category */
    private String productCategory;

    /** Vendor ID who owns this product */
    private Long vendorId;

    /** Vendor name for display */
    private String vendorName;

    /** Current stock level */
    private Integer currentStock;

    /** Threshold that triggered this alert */
    private Integer threshold;

    /** Alert severity: CRITICAL (out of stock), WARNING (below threshold), LOW (approaching threshold) */
    private String severity;

    /** Alert status: ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED */
    private String status;

    /** Admin notes */
    @Column(length = 500)
    private String notes;

    private Long createdAt;
    private Long updatedAt;
    private Long acknowledgedAt;
    private Long resolvedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now().toEpochMilli();
        updatedAt = Instant.now().toEpochMilli();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now().toEpochMilli();
    }
}
