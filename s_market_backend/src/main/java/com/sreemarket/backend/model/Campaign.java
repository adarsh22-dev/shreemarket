package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "campaigns")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String type; // EMAIL, SMS, WHATSAPP

    private String subject;

    @Column(columnDefinition = "TEXT")
    private String body;

    private String targetAudience; // ALL, CUSTOMERS, VENDORS, SPECIFIC

    @Column(columnDefinition = "TEXT")
    private String recipientIds; // JSON string for SPECIFIC audience

    private String status; // DRAFT, SCHEDULED, SENDING, SENT, COMPLETED, FAILED

    private Long scheduledAt;

    private Long sentAt;

    private Integer totalRecipients;

    private Integer successCount;

    private Integer failCount;

    private String createdBy;

    private Long createdAt;

    private Long updatedAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = System.currentTimeMillis();
        this.updatedAt = System.currentTimeMillis();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = System.currentTimeMillis();
    }
}
