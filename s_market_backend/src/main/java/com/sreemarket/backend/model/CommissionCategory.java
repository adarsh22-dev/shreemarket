package com.sreemarket.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "commission_categories")
public class CommissionCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String category;
    private String type;
    private Double value;
    private Double minOrder;
    private Double maxCap;
    private Boolean gst;
    private Double flatFee;
    private Boolean active;
    private Integer priority;
    private String appliedTo;
    private Double revenue;

    public CommissionCategory() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Double getValue() { return value; }
    public void setValue(Double value) { this.value = value; }

    public Double getMinOrder() { return minOrder; }
    public void setMinOrder(Double minOrder) { this.minOrder = minOrder; }

    public Double getMaxCap() { return maxCap; }
    public void setMaxCap(Double maxCap) { this.maxCap = maxCap; }

    public Boolean getGst() { return gst; }
    public void setGst(Boolean gst) { this.gst = gst; }

    public Double getFlatFee() { return flatFee; }
    public void setFlatFee(Double flatFee) { this.flatFee = flatFee; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }

    public String getAppliedTo() { return appliedTo; }
    public void setAppliedTo(String appliedTo) { this.appliedTo = appliedTo; }

    public Double getRevenue() { return revenue; }
    public void setRevenue(Double revenue) { this.revenue = revenue; }
}
