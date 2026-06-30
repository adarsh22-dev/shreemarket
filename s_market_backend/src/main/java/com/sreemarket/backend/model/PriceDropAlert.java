package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "price_drop_alerts")
public class PriceDropAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long productId;

    private Double targetPrice;

    private Double currentPrice;

    private String email;

    private String status; // ACTIVE, TRIGGERED, EXPIRED, CANCELLED

    private Long triggeredAt;

    private Long createdAt = System.currentTimeMillis();
}
