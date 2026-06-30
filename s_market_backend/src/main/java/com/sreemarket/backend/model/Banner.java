package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "banners")
public class Banner {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String position;
    private String page;
    private String device;
    private Boolean active;
    private Integer clicks;
    private Integer impressions;
    private String startDate;
    private String endDate;
    private String cta;
    private String url;
    private String gradient;
    private Integer sortOrder;

    public Banner() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public String getPage() { return page; }
    public void setPage(String page) { this.page = page; }
    public String getDevice() { return device; }
    public void setDevice(String device) { this.device = device; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Integer getClicks() { return clicks; }
    public void setClicks(Integer clicks) { this.clicks = clicks; }
    public Integer getImpressions() { return impressions; }
    public void setImpressions(Integer impressions) { this.impressions = impressions; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public String getCta() { return cta; }
    public void setCta(String cta) { this.cta = cta; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getGradient() { return gradient; }
    public void setGradient(String gradient) { this.gradient = gradient; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
