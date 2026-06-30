package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "size_guides")
public class SizeGuide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String category;

    @Column(columnDefinition = "TEXT")
    private String sizeChart; // JSON array of size rows

    private String measurementUnit; // cm, inches

    @Column(length = 1000)
    private String fitTips;

    private Boolean active;
    private Long createdAt;

    public SizeGuide() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSizeChart() { return sizeChart; }
    public void setSizeChart(String sizeChart) { this.sizeChart = sizeChart; }

    public String getMeasurementUnit() { return measurementUnit; }
    public void setMeasurementUnit(String measurementUnit) { this.measurementUnit = measurementUnit; }

    public String getFitTips() { return fitTips; }
    public void setFitTips(String fitTips) { this.fitTips = fitTips; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    @PrePersist
    protected void onCreate() {
        createdAt = System.currentTimeMillis();
        if (active == null) active = true;
    }
}
