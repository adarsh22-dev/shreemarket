package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "faqs")
public class Faq {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String question;
    private String category;
    @Column(columnDefinition = "TEXT")
    private String answer;
    private String status;
    private Integer sortOrder;
    private Integer views;

    public Faq() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public Integer getViews() { return views; }
    public void setViews(Integer views) { this.views = views; }
}
