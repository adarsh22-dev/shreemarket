package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.ProductQuestion;
import com.sreemarket.backend.repository.ProductQuestionRepository;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ProductQuestionController {

    @Autowired
    private ProductQuestionRepository questionRepository;

    @GetMapping("/{productId}/questions")
    public ResponseEntity<?> getProductQuestions(@PathVariable Long productId) {
        List<ProductQuestion> questions = questionRepository.findByProductIdAndIsPublicTrueOrderByCreatedAtDesc(productId);
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/{productId}/questions")
    public ResponseEntity<?> askQuestion(@PathVariable Long productId,
                                          @RequestBody Map<String, String> body,
                                          HttpServletRequest request) {
        String question = body.get("question");
        if (question == null || question.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question is required"));
        }
        ProductQuestion pq = new ProductQuestion();
        pq.setProductId(productId);
        pq.setQuestion(question.trim());
        pq.setCustomerName(body.getOrDefault("customerName", "Anonymous"));
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId != null) pq.setUserId(userId);
        pq.setCreatedAt(System.currentTimeMillis());
        pq.setPublic(true);
        ProductQuestion saved = questionRepository.save(pq);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/questions/{id}/answer")
    public ResponseEntity<?> answerQuestion(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        ProductQuestion pq = questionRepository.findById(id).orElse(null);
        if (pq == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Question not found"));
        }
        pq.setAnswer(body.get("answer"));
        pq.setAnsweredBy(body.get("answeredBy"));
        pq.setAnsweredAt(System.currentTimeMillis());
        questionRepository.save(pq);
        return ResponseEntity.ok(pq);
    }
}
