package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "cms_pages")
public class CmsPage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String slug;
    private String status;
    private String visibility;
    private String template;
    private String author;
    private String updatedAt;
    private String metaTitle;
    private String metaDesc;

    @Column(columnDefinition = "TEXT")
    private String content;

    public CmsPage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public String getTemplate() { return template; }
    public void setTemplate(String template) { this.template = template; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
    public String getMetaTitle() { return metaTitle; }
    public void setMetaTitle(String metaTitle) { this.metaTitle = metaTitle; }
    public String getMetaDesc() { return metaDesc; }
    public void setMetaDesc(String metaDesc) { this.metaDesc = metaDesc; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
