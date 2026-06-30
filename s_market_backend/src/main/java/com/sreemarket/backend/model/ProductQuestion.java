package com.sreemarket.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "product_questions")
public class ProductQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(nullable = false, length = 500)
    private String question;

    @Column(length = 500)
    private String answer;

    @Column(name = "answered_by")
    private String answeredBy;

    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "answered_at")
    private Long answeredAt;

    @Column(name = "is_public")
    private boolean isPublic = true;

    public ProductQuestion() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public String getAnsweredBy() { return answeredBy; }
    public void setAnsweredBy(String answeredBy) { this.answeredBy = answeredBy; }
    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }
    public Long getAnsweredAt() { return answeredAt; }
    public void setAnsweredAt(Long answeredAt) { this.answeredAt = answeredAt; }
    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }
}
