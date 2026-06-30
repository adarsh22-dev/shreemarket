package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "blog_posts")
public class BlogPost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String category;
    private String author;
    private String status;
    private String tags;
    private Integer views;
    private Integer comments;
    private Integer readMin;
    private String date;
    private String slug;
    private String metaTitle;
    private String metaDesc;

    public BlogPost() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public Integer getViews() { return views; }
    public void setViews(Integer views) { this.views = views; }
    public Integer getComments() { return comments; }
    public void setComments(Integer comments) { this.comments = comments; }
    public Integer getReadMin() { return readMin; }
    public void setReadMin(Integer readMin) { this.readMin = readMin; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getMetaTitle() { return metaTitle; }
    public void setMetaTitle(String metaTitle) { this.metaTitle = metaTitle; }
    public String getMetaDesc() { return metaDesc; }
    public void setMetaDesc(String metaDesc) { this.metaDesc = metaDesc; }
}
