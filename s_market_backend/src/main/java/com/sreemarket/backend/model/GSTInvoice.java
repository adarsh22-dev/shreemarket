package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "gst_invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GSTInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String invoiceId;
    private String vendor;
    private String gstin;
    private String period;
    private Double gross;
    private Double commission;
    private Double gstOnComm;
    private Double netComm;
    private Double tds;
    private Double netPayout;
    private String type;
    private String status;
    private String issued;
    private String due;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInvoiceId() { return invoiceId; }
    public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }

    public String getVendor() { return vendor; }
    public void setVendor(String vendor) { this.vendor = vendor; }

    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public Double getGross() { return gross; }
    public void setGross(Double gross) { this.gross = gross; }

    public Double getCommission() { return commission; }
    public void setCommission(Double commission) { this.commission = commission; }

    public Double getGstOnComm() { return gstOnComm; }
    public void setGstOnComm(Double gstOnComm) { this.gstOnComm = gstOnComm; }

    public Double getNetComm() { return netComm; }
    public void setNetComm(Double netComm) { this.netComm = netComm; }

    public Double getTds() { return tds; }
    public void setTds(Double tds) { this.tds = tds; }

    public Double getNetPayout() { return netPayout; }
    public void setNetPayout(Double netPayout) { this.netPayout = netPayout; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getIssued() { return issued; }
    public void setIssued(String issued) { this.issued = issued; }

    public String getDue() { return due; }
    public void setDue(String due) { this.due = due; }
}
