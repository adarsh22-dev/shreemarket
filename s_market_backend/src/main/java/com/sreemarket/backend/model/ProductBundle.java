package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_bundles")
public class ProductBundle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    @Column(columnDefinition = "TEXT")
    private String productIds; // JSON array of product IDs

    private Double bundlePrice;

    private Double savingsPercentage;

    private String status; // ACTIVE, INACTIVE

    private String image;

    private Long vendorId;

    private Long createdAt = System.currentTimeMillis();

    private Long updatedAt = System.currentTimeMillis();
}
