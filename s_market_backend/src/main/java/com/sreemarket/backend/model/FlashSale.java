package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "flash_sales")
public class FlashSale {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Integer discount;
    private String startDate;
    private String endDate;
    private String startTime;
    private String endTime;
    private Integer products;
    private Integer sold;
    private Double revenue;
    private String status;
    private String banner;
    private String category;
    private String description;

    public FlashSale() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getDiscount() { return discount; }
    public void setDiscount(Integer discount) { this.discount = discount; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public Integer getProducts() { return products; }
    public void setProducts(Integer products) { this.products = products; }
    public Integer getSold() { return sold; }
    public void setSold(Integer sold) { this.sold = sold; }
    public Double getRevenue() { return revenue; }
    public void setRevenue(Double revenue) { this.revenue = revenue; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getBanner() { return banner; }
    public void setBanner(String banner) { this.banner = banner; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
