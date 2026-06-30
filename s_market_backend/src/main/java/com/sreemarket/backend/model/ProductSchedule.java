package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "product_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false)
    private Long vendorId;

    private Long publishAt;
    private Long unpublishAt;

    private boolean published = false;

    private Long createdAt;
    private Long updatedAt;
}
