package com.sreemarket.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.util.List;

@Entity
@Table(name = "payout_batches")
public class PayoutBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable batch ID (e.g. BATCH-20260224-001) */
    private String batchId;

    /** Date this batch was created (epoch ms) */
    private Long createdAt;

    /** When processing started (epoch ms) */
    private Long startedAt;

    /** When processing completed (epoch ms) */
    private Long completedAt;

    /** Total gross amount across all payouts in this batch */
    private Double totalGrossAmount;

    /** Total commission deducted */
    private Double totalCommission;

    /** Total fees deducted */
    private Double totalFee;

    /** Total TDS deducted */
    private Double totalTds;

    /** Total penalties deducted */
    private Double totalPenalty;

    /** Total net amount to be paid out */
    private Double totalNetAmount;

    /** Number of vendors in this batch */
    private Integer vendorCount;

    /** Number of successful payouts */
    private Integer successCount;

    /** Number of failed payouts */
    private Integer failedCount;

    /** Payment method used for this batch */
    private String method;       // NEFT, IMPS, RTGS, UPI

    /** Status: pending, processing, completed, partially_completed, failed */
    private String status;

    /** Admin who processed this batch */
    private Long processedBy;

    /** Notes about this batch */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Error details if batch failed */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String errorDetails;

    public PayoutBatch() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    public Long getStartedAt() { return startedAt; }
    public void setStartedAt(Long startedAt) { this.startedAt = startedAt; }

    public Long getCompletedAt() { return completedAt; }
    public void setCompletedAt(Long completedAt) { this.completedAt = completedAt; }

    public Double getTotalGrossAmount() { return totalGrossAmount; }
    public void setTotalGrossAmount(Double totalGrossAmount) { this.totalGrossAmount = totalGrossAmount; }

    public Double getTotalCommission() { return totalCommission; }
    public void setTotalCommission(Double totalCommission) { this.totalCommission = totalCommission; }

    public Double getTotalFee() { return totalFee; }
    public void setTotalFee(Double totalFee) { this.totalFee = totalFee; }

    public Double getTotalTds() { return totalTds; }
    public void setTotalTds(Double totalTds) { this.totalTds = totalTds; }

    public Double getTotalPenalty() { return totalPenalty; }
    public void setTotalPenalty(Double totalPenalty) { this.totalPenalty = totalPenalty; }

    public Double getTotalNetAmount() { return totalNetAmount; }
    public void setTotalNetAmount(Double totalNetAmount) { this.totalNetAmount = totalNetAmount; }

    public Integer getVendorCount() { return vendorCount; }
    public void setVendorCount(Integer vendorCount) { this.vendorCount = vendorCount; }

    public Integer getSuccessCount() { return successCount; }
    public void setSuccessCount(Integer successCount) { this.successCount = successCount; }

    public Integer getFailedCount() { return failedCount; }
    public void setFailedCount(Integer failedCount) { this.failedCount = failedCount; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getProcessedBy() { return processedBy; }
    public void setProcessedBy(Long processedBy) { this.processedBy = processedBy; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getErrorDetails() { return errorDetails; }
    public void setErrorDetails(String errorDetails) { this.errorDetails = errorDetails; }
}
