package com.sreemarket.backend.model.wooai;

import jakarta.persistence.*;

@Entity
@Table(name = "wooai_quick_actions")
public class QuickAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String label;

    private String icon;

    @Column(name = "action_type")
    private String actionType;

    @Column(columnDefinition = "TEXT")
    private String description;

    private boolean active;

    private int clicks;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getClicks() { return clicks; }
    public void setClicks(int clicks) { this.clicks = clicks; }
}
