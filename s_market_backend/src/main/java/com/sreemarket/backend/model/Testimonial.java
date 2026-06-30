package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "testimonials")
public class Testimonial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "review_id")
    private Long reviewId;

    private String reviewerName;

    private Integer rating;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String text;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "product_image")
    private String productImage;

    private Boolean active = true;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    private Long createdAt;

    public Testimonial() {
    }

    public Testimonial(Review review) {
        this.reviewId = review.getId();
        this.reviewerName = review.getReviewerName();
        this.rating = review.getRating();
        this.title = review.getTitle();
        this.text = review.getText();
        if (review.getProduct() != null) {
            this.productId = review.getProduct().getId();
            this.productName = review.getProduct().getName();
            if (review.getProduct().getMedia() != null && !review.getProduct().getMedia().isEmpty()) {
                var primary = review.getProduct().getMedia().stream()
                        .filter(m -> Boolean.TRUE.equals(m.getIsPrimary()))
                        .findFirst().orElse(review.getProduct().getMedia().get(0));
                this.productImage = primary.getFileName();
            }
        }
    }

    @PrePersist
    protected void onCreate() {
        createdAt = System.currentTimeMillis();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getReviewId() { return reviewId; }
    public void setReviewId(Long reviewId) { this.reviewId = reviewId; }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductImage() { return productImage; }
    public void setProductImage(String productImage) { this.productImage = productImage; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }
}
