package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "back_in_stock_alerts")
public class BackInStockAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long productId;

    private String email;

    private String status; // ACTIVE, NOTIFIED, EXPIRED, CANCELLED

    private Long notifiedAt;

    private Long createdAt = System.currentTimeMillis();
}
