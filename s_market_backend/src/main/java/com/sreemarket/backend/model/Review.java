package com.sreemarket.backend.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "user_id")
    @JsonProperty("userId")
    private Long userId;

    private String reviewerName;

    @Column(nullable = false)
    private Integer rating;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String text;

    @ElementCollection
    @CollectionTable(name = "review_images", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "file_name")
    private List<String> images = new ArrayList<>();

    private Boolean verifiedBuyer = false;

    private Integer helpfulCount = 0;

    private Integer notHelpfulCount = 0;

    private Long createdAt;

    @Column(columnDefinition = "TEXT")
    private String vendorReply;

    private Long replyDate;

    public Review() {
    }

    public Review(Product product, Long userId, String reviewerName, Integer rating, String title, String text) {
        this.product = product;
        this.userId = userId;
        this.reviewerName = reviewerName;
        this.rating = rating;
        this.title = title;
        this.text = text;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = System.currentTimeMillis();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getReviewerName() {
        return reviewerName;
    }

    public void setReviewerName(String reviewerName) {
        this.reviewerName = reviewerName;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public Boolean getVerifiedBuyer() {
        return verifiedBuyer;
    }

    public void setVerifiedBuyer(Boolean verifiedBuyer) {
        this.verifiedBuyer = verifiedBuyer;
    }

    public Integer getHelpfulCount() {
        return helpfulCount;
    }

    public void setHelpfulCount(Integer helpfulCount) {
        this.helpfulCount = helpfulCount;
    }

    public Integer getNotHelpfulCount() {
        return notHelpfulCount;
    }

    public void setNotHelpfulCount(Integer notHelpfulCount) {
        this.notHelpfulCount = notHelpfulCount;
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    public String getVendorReply() {
        return vendorReply;
    }

    public void setVendorReply(String vendorReply) {
        this.vendorReply = vendorReply;
    }

    public Long getReplyDate() {
        return replyDate;
    }

    public void setReplyDate(Long replyDate) {
        this.replyDate = replyDate;
    }
}
