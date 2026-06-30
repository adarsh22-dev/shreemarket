package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "shipping_zones")
public class ShippingZone {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String regions; // JSON array of states/countries

    @Column(columnDefinition = "TEXT")
    private String pincodes; // comma-separated pincodes or CSV content

    private String deliveryType; // STANDARD, EXPRESS, SAME_DAY

    private Double baseRate;

    private Double ratePerKg;

    private Double freeShippingAbove;

    private Integer estimatedDaysMin;

    private Integer estimatedDaysMax;

    private Boolean isActive = true;

    private Long createdAt = System.currentTimeMillis();

    private Long updatedAt = System.currentTimeMillis();
}
