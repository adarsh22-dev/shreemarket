package com.sreemarket.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "delivery_partners")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryPartner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String code;
    private String coverage;
    private String phone;
    private String email;
    private Integer activeOrders;
    private Integer delivered;
    private Double rating;
    private Double avgDays;
    private String cost;
    private String status;
    private String color;
    private String joined;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getCoverage() { return coverage; }
    public void setCoverage(String coverage) { this.coverage = coverage; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Integer getActiveOrders() { return activeOrders; }
    public void setActiveOrders(Integer activeOrders) { this.activeOrders = activeOrders; }

    public Integer getDelivered() { return delivered; }
    public void setDelivered(Integer delivered) { this.delivered = delivered; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Double getAvgDays() { return avgDays; }
    public void setAvgDays(Double avgDays) { this.avgDays = avgDays; }

    public String getCost() { return cost; }
    public void setCost(String cost) { this.cost = cost; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getJoined() { return joined; }
    public void setJoined(String joined) { this.joined = joined; }
}
