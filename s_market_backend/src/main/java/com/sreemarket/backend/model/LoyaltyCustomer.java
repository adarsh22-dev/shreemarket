package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "loyalty_customers")
public class LoyaltyCustomer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    
    @Column(name = "user_id")
    private Long userId;
    
    private String tier;
    private Integer points;
    private Integer earned;
    private Integer redeemed;
    private String expires;
    private String lastActivity;

    public LoyaltyCustomer() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public Integer getEarned() { return earned; }
    public void setEarned(Integer earned) { this.earned = earned; }
    public Integer getRedeemed() { return redeemed; }
    public void setRedeemed(Integer redeemed) { this.redeemed = redeemed; }
    public String getExpires() { return expires; }
    public void setExpires(String expires) { this.expires = expires; }
    public String getLastActivity() { return lastActivity; }
    public void setLastActivity(String lastActivity) { this.lastActivity = lastActivity; }
}
