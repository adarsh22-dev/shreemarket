package com.sreemarket.backend.model.wooai;

import jakarta.persistence.*;

@Entity
@Table(name = "wooai_product_assignments")
public class ProductAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_key")
    private String sectionKey;

    @Column(name = "product_id")
    private String productId;

    @Column(name = "product_name")
    private String productName;

    private String category;

    private double price;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSectionKey() { return sectionKey; }
    public void setSectionKey(String sectionKey) { this.sectionKey = sectionKey; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
}
