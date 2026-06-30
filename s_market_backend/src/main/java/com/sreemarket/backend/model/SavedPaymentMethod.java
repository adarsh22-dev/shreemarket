package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "saved_payment_methods")
public class SavedPaymentMethod {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String type; // CARD, UPI, NET_BANKING

    private String provider; // Razorpay, Stripe

    private String gatewayPaymentMethodId;

    private String lastFourDigits;

    private String cardHolderName;

    private String cardNetwork; // VISA, MASTERCARD, RUPAY

    private String expiryMonth;

    private String expiryYear;

    private String upiId;

    private String bankName;

    private Boolean isDefault = false;

    private Boolean isActive = true;

    private Long createdAt = System.currentTimeMillis();

    private Long updatedAt = System.currentTimeMillis();
}
