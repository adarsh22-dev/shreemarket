package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "help_articles")
public class HelpArticle {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String time;
    private String badge;
    private String icon;

    public HelpArticle() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
}
