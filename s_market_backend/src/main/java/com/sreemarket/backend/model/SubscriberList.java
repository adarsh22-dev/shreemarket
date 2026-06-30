package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "subscriber_lists")
public class SubscriberList {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String listId;
    private String name;
    private String emails;
    private Integer count;
    private String growth;

    public SubscriberList() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getListId() { return listId; }
    public void setListId(String listId) { this.listId = listId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmails() { return emails; }
    public void setEmails(String emails) { this.emails = emails; }
    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
    public String getGrowth() { return growth; }
    public void setGrowth(String growth) { this.growth = growth; }
}
