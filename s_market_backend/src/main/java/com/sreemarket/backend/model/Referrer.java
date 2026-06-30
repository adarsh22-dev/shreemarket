package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "referrers")
public class Referrer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id")
    private Long userId;
    private String name;
    private String email;
    private Integer refs;
    private Double earned;
    private Double redeemed;
    private Double pending;
    private String tier;
    private String joined;
    private String code;
    private Boolean active;

    public Referrer() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Integer getRefs() { return refs; }
    public void setRefs(Integer refs) { this.refs = refs; }
    public Double getEarned() { return earned; }
    public void setEarned(Double earned) { this.earned = earned; }
    public Double getRedeemed() { return redeemed; }
    public void setRedeemed(Double redeemed) { this.redeemed = redeemed; }
    public Double getPending() { return pending; }
    public void setPending(Double pending) { this.pending = pending; }
    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }
    public String getJoined() { return joined; }
    public void setJoined(String joined) { this.joined = joined; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
