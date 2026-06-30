package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "custom_snippets")
public class CustomSnippet {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String label;
    private String location;
    private String slot;
    @Column(columnDefinition = "TEXT")
    private String code;
    private String notes;
    private Boolean active;
    private String createdAt;
    private String updatedAt;

    public CustomSnippet() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getSlot() { return slot; }
    public void setSlot(String slot) { this.slot = slot; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
