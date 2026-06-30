package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "tax_rates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaxRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private Double rate;

    private String taxType;

    private String hsnCode;

    private Double cgst;
    private Double sgst;
    private Double igst;

    private Double tcsRate;

    @Column(length = 500)
    private String description;

    private String applicableCategories;

    private String status;

    private Boolean isDefault;

    private Long effectiveFrom;

    private Long effectiveTo;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getRate() { return rate; }
    public void setRate(Double rate) { this.rate = rate; }

    public String getTaxType() { return taxType; }
    public void setTaxType(String taxType) { this.taxType = taxType; }

    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }

    public Double getCgst() { return cgst; }
    public void setCgst(Double cgst) { this.cgst = cgst; }

    public Double getSgst() { return sgst; }
    public void setSgst(Double sgst) { this.sgst = sgst; }

    public Double getIgst() { return igst; }
    public void setIgst(Double igst) { this.igst = igst; }

    public Double getTcsRate() { return tcsRate; }
    public void setTcsRate(Double tcsRate) { this.tcsRate = tcsRate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getApplicableCategories() { return applicableCategories; }
    public void setApplicableCategories(String applicableCategories) { this.applicableCategories = applicableCategories; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }

    public Long getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(Long effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    public Long getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(Long effectiveTo) { this.effectiveTo = effectiveTo; }
}
