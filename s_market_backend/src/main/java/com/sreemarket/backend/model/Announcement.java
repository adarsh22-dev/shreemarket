package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "announcements")
public class Announcement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String type; // INFO, WARNING, URGENT, MAINTENANCE

    private String targetAudience; // ALL, VENDORS, CUSTOMERS, ADMINS

    private String status; // ACTIVE, SCHEDULED, EXPIRED, DRAFT

    private Long scheduledAt;

    private Long expiresAt;

    private String createdBy;

    private Long createdAt = System.currentTimeMillis();

    private Long updatedAt = System.currentTimeMillis();
}
