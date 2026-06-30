package com.sreemarket.backend.model.wooai;

import jakarta.persistence.*;

@Entity
@Table(name = "wooai_routing_rules")
public class RoutingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String intent;

    private String assignee;

    private String priority;

    private boolean active;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }

    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
