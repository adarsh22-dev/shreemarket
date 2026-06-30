package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "newsletter_campaigns")
public class NewsletterCampaign {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String subject;
    private String listId;
    private String sent;
    private String scheduled;
    private Integer recipients;
    private Integer opens;
    private Integer clicks;
    private Integer unsubscribes;
    private String status;

    public NewsletterCampaign() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getListId() { return listId; }
    public void setListId(String listId) { this.listId = listId; }
    public String getSent() { return sent; }
    public void setSent(String sent) { this.sent = sent; }
    public String getScheduled() { return scheduled; }
    public void setScheduled(String scheduled) { this.scheduled = scheduled; }
    public Integer getRecipients() { return recipients; }
    public void setRecipients(Integer recipients) { this.recipients = recipients; }
    public Integer getOpens() { return opens; }
    public void setOpens(Integer opens) { this.opens = opens; }
    public Integer getClicks() { return clicks; }
    public void setClicks(Integer clicks) { this.clicks = clicks; }
    public Integer getUnsubscribes() { return unsubscribes; }
    public void setUnsubscribes(Integer unsubscribes) { this.unsubscribes = unsubscribes; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
