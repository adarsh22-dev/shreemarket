package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "vendor_subscriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long vendorId;

    @Column(nullable = false)
    private Long planId;

    private String planName;

    private String billingCycle;

    private Double amount;

    private Long startDate;
    private Long endDate;

    private String status;
}
