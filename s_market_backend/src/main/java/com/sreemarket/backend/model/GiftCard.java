package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "gift_cards")
public class GiftCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;

    private Double initialBalance;

    private Double currentBalance;

    private String currency = "INR";

    private Long senderUserId;

    private String senderEmail;

    private String senderName;

    private Long recipientUserId;

    private String recipientEmail;

    private String recipientName;

    private String message;

    private Long vendorId;

    private String status; // ACTIVE, REDEEMED, EXPIRED, CANCELLED

    private Long expiresAt;

    private Long createdAt = System.currentTimeMillis();

    private Long redeemedAt;
}
