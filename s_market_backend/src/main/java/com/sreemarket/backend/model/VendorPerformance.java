package com.sreemarket.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "vendor_performance")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorPerformance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long vendorId;
    private String vendorName;
    private Double fulfillment;
    private Double returns;
    private Double rating;
    private Double response;
    private Integer complaints;
    private Integer score;
}
