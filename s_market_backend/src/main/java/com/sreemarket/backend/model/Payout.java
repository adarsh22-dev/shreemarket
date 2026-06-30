package com.sreemarket.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "payouts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable payout ID (e.g. PAY-20260224-001) */
    private String payoutId;

    /** Vendor this payout belongs to */
    private Long vendorId;
    private String vendorName;

    /** Financial breakdown */
    private Double grossAmount;
    private Double commission;
    private Double fee;
    private Double tds;
    private Double penalty;
    private Double netAmount;

    /** Legacy string amount field for backward compatibility */
    private String amount;

    private String period;
    private String method;       // NEFT, IMPS, RTGS, UPI
    private String status;       // pending, approved, processing, paid, failed, rejected

    private String date;
    private Long processedAt;    // epoch ms

    /** Payment gateway references */
    private String transactionId;
    private String upiRef;
    private String bankRef;
    private String utrNumber;    // UTR for NEFT/RTGS

    /** Batch tracking */
    private String batchId;

    /** Payment receipt / invoice */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String receiptHtml;

    private String notes;
    private Integer orders;

    /** JSON array of order IDs included in this withdrawal request */
    @Column(columnDefinition = "TEXT")
    private String orderIds;
}
