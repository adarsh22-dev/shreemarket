package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "url_redirects")
public class UrlRedirect {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String fromPath;
    private String toPath;
    private String type;
    private Boolean active;
    private Integer hits;
    private String note;
    private String createdAt;

    public UrlRedirect() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFromPath() { return fromPath; }
    public void setFromPath(String fromPath) { this.fromPath = fromPath; }
    public String getToPath() { return toPath; }
    public void setToPath(String toPath) { this.toPath = toPath; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Integer getHits() { return hits; }
    public void setHits(Integer hits) { this.hits = hits; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
