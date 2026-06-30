package com.sreemarket.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "payout_schedules")
public class PayoutSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String scheduleId;
    private Long vendorId;
    private String vendorName;
    private String tier;
    private String frequency;
    private String day;
    private String method;
    private String bank;
    private Double threshold;
    private String nextRun;
    private String lastRun;
    private String status;
    private Boolean autoApprove;
    private Long createdAt;

    public PayoutSchedule() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getScheduleId() { return scheduleId; }
    public void setScheduleId(String scheduleId) { this.scheduleId = scheduleId; }

    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getBank() { return bank; }
    public void setBank(String bank) { this.bank = bank; }

    public Double getThreshold() { return threshold; }
    public void setThreshold(Double threshold) { this.threshold = threshold; }

    public String getNextRun() { return nextRun; }
    public void setNextRun(String nextRun) { this.nextRun = nextRun; }

    public String getLastRun() { return lastRun; }
    public void setLastRun(String lastRun) { this.lastRun = lastRun; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getAutoApprove() { return autoApprove; }
    public void setAutoApprove(Boolean autoApprove) { this.autoApprove = autoApprove; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }
}
