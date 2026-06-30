package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "abandoned_carts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AbandonedCart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long cartId;

    private Long abandonedAt; // When the cart was detected as abandoned

    private Double cartTotal;

    private Integer itemCount;

    @Column(columnDefinition = "TEXT")
    private String cartSummary; // JSON summary of cart items

    private String status; // PENDING, RECOVERED, EXPIRED, DISMISSED

    private Integer recoveryAttempts = 0;

    private Long lastAttemptAt;

    private Long recoveredAt;

    private String recoveryMethod; // EMAIL, SMS, PUSH

    private String emailSentTo;

    private Boolean emailOpened;

    private Boolean linkClicked;

    private Long createdAt;
    private Long updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = System.currentTimeMillis();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = System.currentTimeMillis();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getCartId() { return cartId; }
    public void setCartId(Long cartId) { this.cartId = cartId; }
    public Long getAbandonedAt() { return abandonedAt; }
    public void setAbandonedAt(Long abandonedAt) { this.abandonedAt = abandonedAt; }
    public Double getCartTotal() { return cartTotal; }
    public void setCartTotal(Double cartTotal) { this.cartTotal = cartTotal; }
    public Integer getItemCount() { return itemCount; }
    public void setItemCount(Integer itemCount) { this.itemCount = itemCount; }
    public String getCartSummary() { return cartSummary; }
    public void setCartSummary(String cartSummary) { this.cartSummary = cartSummary; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getRecoveryAttempts() { return recoveryAttempts; }
    public void setRecoveryAttempts(Integer recoveryAttempts) { this.recoveryAttempts = recoveryAttempts; }
    public Long getLastAttemptAt() { return lastAttemptAt; }
    public void setLastAttemptAt(Long lastAttemptAt) { this.lastAttemptAt = lastAttemptAt; }
    public Long getRecoveredAt() { return recoveredAt; }
    public void setRecoveredAt(Long recoveredAt) { this.recoveredAt = recoveredAt; }
    public String getRecoveryMethod() { return recoveryMethod; }
    public void setRecoveryMethod(String recoveryMethod) { this.recoveryMethod = recoveryMethod; }
    public String getEmailSentTo() { return emailSentTo; }
    public void setEmailSentTo(String emailSentTo) { this.emailSentTo = emailSentTo; }
    public Boolean getEmailOpened() { return emailOpened; }
    public void setEmailOpened(Boolean emailOpened) { this.emailOpened = emailOpened; }
    public Boolean getLinkClicked() { return linkClicked; }
    public void setLinkClicked(Boolean linkClicked) { this.linkClicked = linkClicked; }
    public Long getCreatedAt() { return createdAt; }
    public Long getUpdatedAt() { return updatedAt; }
}
