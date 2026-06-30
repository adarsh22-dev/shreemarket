package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "push_notifications")
public class PushNotification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(columnDefinition = "TEXT")
    private String body;
    private String segment;
    private String scheduled;
    private String sent;
    private Integer delivered;
    private Integer opened;
    private Double ctr;
    private String status;

    public PushNotification() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getSegment() { return segment; }
    public void setSegment(String segment) { this.segment = segment; }
    public String getScheduled() { return scheduled; }
    public void setScheduled(String scheduled) { this.scheduled = scheduled; }
    public String getSent() { return sent; }
    public void setSent(String sent) { this.sent = sent; }
    public Integer getDelivered() { return delivered; }
    public void setDelivered(Integer delivered) { this.delivered = delivered; }
    public Integer getOpened() { return opened; }
    public void setOpened(Integer opened) { this.opened = opened; }
    public Double getCtr() { return ctr; }
    public void setCtr(Double ctr) { this.ctr = ctr; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
