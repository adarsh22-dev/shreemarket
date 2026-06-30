package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "order_fulfillments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderFulfillment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private Long vendorId;

    @Column(columnDefinition = "TEXT")
    private String productQuantitiesJson;

    private String status;

    private String trackingNumber;
    private String carrierName;

    private Long createdAt;
    private Long updatedAt;
}
