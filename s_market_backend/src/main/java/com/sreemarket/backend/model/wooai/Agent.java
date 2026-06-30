package com.sreemarket.backend.model.wooai;

import jakarta.persistence.*;

@Entity
@Table(name = "wooai_agents")
public class Agent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String role;

    private String status;

    @Column(name = "active_chats")
    private int activeChats;

    private int capacity;

    private String color;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getActiveChats() { return activeChats; }
    public void setActiveChats(int activeChats) { this.activeChats = activeChats; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
