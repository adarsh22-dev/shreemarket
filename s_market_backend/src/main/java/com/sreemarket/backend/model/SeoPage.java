package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "seo_pages")
public class SeoPage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String page;
    private String url;
    private String title;
    private String description;
    private String status;

    public SeoPage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPage() { return page; }
    public void setPage(String page) { this.page = page; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
