package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "wholesalers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Wholesaler {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String email;
    private String phone;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private Long roleId = 4L;
    private String status = "Pending";

    private String businessName;
    private String gstNumber;
    private String businessAddress;
    private String businessPhone;
    private String businessType;

    private Double minMonthlyOrderValue;

    private Boolean agreeTerms;
    private Boolean agreePolicies;

    private Long createdAt;
    private Long updatedAt;
}
