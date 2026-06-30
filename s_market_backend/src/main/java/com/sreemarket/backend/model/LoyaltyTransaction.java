package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "loyalty_transactions")
public class LoyaltyTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    private String type; // "EARNED" or "REDEEMED"
    private Integer points;
    private String reason;
    private String reference; // Order number, review ID, etc.
    private Long createdAt;

    public LoyaltyTransaction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    @PrePersist
    protected void onCreate() {
        createdAt = System.currentTimeMillis();
    }
}
