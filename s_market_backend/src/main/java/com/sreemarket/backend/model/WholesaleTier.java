package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "wholesale_tiers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WholesaleTier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "min_qty")
    private Integer minQty;

    @Column(name = "max_qty")
    private Integer maxQty;

    @Column(name = "unit_price")
    private Double unitPrice;
}
