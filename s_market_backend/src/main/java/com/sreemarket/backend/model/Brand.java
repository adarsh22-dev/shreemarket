package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "brands")
public class Brand {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String logo;
    private String category;
    private String country;
    private String website;
    private Boolean featured;
    private Boolean verified;
    private String status;

    public Brand() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLogo() { return logo; }
    public void setLogo(String logo) { this.logo = logo; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public Boolean getFeatured() { return featured; }
    public void setFeatured(Boolean featured) { this.featured = featured; }
    public Boolean getVerified() { return verified; }
    public void setVerified(Boolean verified) { this.verified = verified; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
