package com.sreemarket.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "tiers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String color;
    private String bg;
    private Integer vendors;

    @Column(name = "border_color")
    private String borderColor;

    private String icon;

    @Column(name = "min_sales")
    private Double minSales;

    @Column(name = "max_sales")
    private Double maxSales;

    private Integer discount;

    @Column(name = "min_rating")
    private Double minRating;

    @Column(length = 2000)
    private String perks;

    // Legacy fields kept for backward compatibility
    @Column(name = "min_rev")
    private String minRev;

    @Column(name = "max_rev")
    private String maxRev;

    private String commission;

    @Column(length = 1000)
    private String benefits;
}
