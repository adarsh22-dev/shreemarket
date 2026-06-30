package com.sreemarket.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "vendor_kyc")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorKYC {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long vendorId;
    private String vendorName;
    private String pan;
    private String gst;
    private String aadhaar;

    @Column(columnDefinition = "TEXT")
    private String bank;

    private String paymentMethod;
    private String beneficiaryName;
    private String accountNumber;
    private String ifscCode;
    private String upiId;
    private String paypalEmail;
    private String bankName;
    private String panNumber;
    private String remittanceEmail;

    private String address;
    private String selfie;
    private String overall;
    private String updated;
}
