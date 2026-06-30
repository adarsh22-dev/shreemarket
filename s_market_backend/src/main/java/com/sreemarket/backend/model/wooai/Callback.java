package com.sreemarket.backend.model.wooai;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wooai_callbacks")
public class Callback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_name")
    private String customerName;

    private String phone;

    private String email;

    @Column(columnDefinition = "TEXT")
    private String issue;

    private String priority;

    private String status;

    @Column(name = "requested_time")
    private LocalDateTime requestedTime;

    private String agent;

    private String color;

    @Column(columnDefinition = "TEXT")
    private String note;

    @PrePersist
    protected void onCreate() {
        requestedTime = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getIssue() { return issue; }
    public void setIssue(String issue) { this.issue = issue; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getRequestedTime() { return requestedTime; }
    public void setRequestedTime(LocalDateTime requestedTime) { this.requestedTime = requestedTime; }

    public String getAgent() { return agent; }
    public void setAgent(String agent) { this.agent = agent; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
