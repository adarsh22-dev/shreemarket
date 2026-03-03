package com.sreemarket.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "product_linked")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductLinked {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    @JsonIgnore
    private Product product;

    private String linkedType; // "UPSELL" or "CROSS_SELL"
    private String linkedProductName;

    public void setProduct(Product product) {
        this.product = product;
    }

    public Long getId() {
        return id;
    }

    public String getLinkedType() {
        return linkedType;
    }

    public String getLinkedProductName() {
        return linkedProductName;
    }
}
