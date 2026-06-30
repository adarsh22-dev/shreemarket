package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "marketplace_fees")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MarketplaceFee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Display name for this fee rule */
    private String name;

    /** Fee type: FLAT (fixed amount per order) or TIERED (different rates based on order value ranges) */
    private String feeType;

    /** Flat fee amount (used when feeType = FLAT) */
    private Double flatAmount;

    /** Percentage fee (used when feeType = FLAT, applied on top of flat amount) */
    private Double percentage;

    /**
     * JSON array of tier objects for tiered fees:
     * [{"minOrder":0,"maxOrder":500,"flatAmount":5,"percentage":0},
     *  {"minOrder":500,"maxOrder":2000,"flatAmount":10,"percentage":0.5},
     *  {"minOrder":2000,"maxOrder":null,"flatAmount":15,"percentage":1.0}]
     */
    @Column(columnDefinition = "TEXT")
    private String tierData;

    /** Comma-separated category names this fee applies to (blank = all categories) */
    private String applicableCategories;

    /** Max fee cap per order (null = no cap) */
    private Double maxCap;

    /** Min order amount for this fee to apply */
    private Double minOrderAmount;

    /** Whether this fee is currently active */
    private Boolean active;

    /** Priority for fee stacking (lower = higher priority, fees are not stacked by default) */
    private Integer priority;

    /** Whether GST is charged on this fee */
    private Boolean gstOnFee;

    /** Description shown to vendors */
    @Column(length = 500)
    private String description;

    /** Estimated revenue this month */
    private Double estimatedRevenue;

    private Long createdAt;
    private Long updatedAt;

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
