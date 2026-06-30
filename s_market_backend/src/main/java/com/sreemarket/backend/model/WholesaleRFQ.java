package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "wholesale_rfqs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WholesaleRFQ {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "wholesaler_id", nullable = false)
    private Long wholesalerId;

    @Column(name = "vendor_id")
    private Long vendorId;

    @Column(name = "product_id")
    private Long productId;

    private String productName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "requested_price")
    private Double requestedPrice;

    @Column(length = 1000)
    private String notes;

    private String status;

    @Column(name = "response_message", length = 1000)
    private String responseMessage;

    @Column(name = "counter_price")
    private Double counterPrice;

    @Column(name = "responded_at")
    private Long respondedAt;

    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "updated_at")
    private Long updatedAt;
}
