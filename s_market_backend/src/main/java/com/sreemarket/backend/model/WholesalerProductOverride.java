package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "wholesaler_product_overrides")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WholesalerProductOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "wholesaler_id", nullable = false)
    private Long wholesalerId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "custom_price")
    private Double customPrice;

    private Long createdAt;
    private Long updatedAt;
}
