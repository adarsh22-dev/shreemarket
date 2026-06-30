package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "competitor_prices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompetitorPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "competitor_name")
    private String competitorName;

    private Double price;

    @Column(name = "product_url")
    private String productUrl;

    @Column(name = "last_checked")
    private Long lastChecked;

    @Column(name = "price_history", columnDefinition = "TEXT")
    private String priceHistory; // JSON array of {price, date} objects

    @Column(name = "in_stock")
    private Boolean inStock = true;

    private String notes;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getCompetitorName() { return competitorName; }
    public void setCompetitorName(String competitorName) { this.competitorName = competitorName; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public String getProductUrl() { return productUrl; }
    public void setProductUrl(String productUrl) { this.productUrl = productUrl; }
    public Long getLastChecked() { return lastChecked; }
    public void setLastChecked(Long lastChecked) { this.lastChecked = lastChecked; }
    public String getPriceHistory() { return priceHistory; }
    public void setPriceHistory(String priceHistory) { this.priceHistory = priceHistory; }
    public Boolean getInStock() { return inStock; }
    public void setInStock(Boolean inStock) { this.inStock = inStock; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
