package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "sms_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SmsNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String phoneNumber;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String provider; // SMS, WHATSAPP

    private String status; // PENDING, SENT, FAILED

    private Long sentAt;

    private Long createdAt;

    private String errorMessage;

    @PrePersist
    public void onCreate() {
        this.createdAt = System.currentTimeMillis();
    }
}
