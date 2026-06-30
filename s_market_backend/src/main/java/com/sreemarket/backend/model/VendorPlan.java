package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "vendor_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    private Double monthlyPrice;
    private Double yearlyPrice;

    private Integer maxProducts;
    private Integer maxOrders;
    private Double commissionRate;
    private Boolean featuredListing;
    private Boolean prioritySupport;
    private Boolean advancedAnalytics;
    private Boolean customStorefront;
    private Boolean apiAccess;

    private boolean active = true;

    private Long createdAt;
}
