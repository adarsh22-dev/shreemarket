package com.sreemarket.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreemarket.backend.model.Review;
import com.sreemarket.backend.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getProductReviews(@PathVariable Long productId) {
        List<Review> reviews = reviewService.getReviewsForProduct(productId);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getUserReviews(@PathVariable Long userId) {
        List<Review> reviews = reviewService.getReviewsByUser(userId);
        return ResponseEntity.ok(reviews);
    }

    @PostMapping(consumes = { "multipart/form-data" })
    @CrossOrigin
    public ResponseEntity<?> submitReview(
            @RequestParam("review") String reviewJson,
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {
        try {
            Review review = objectMapper.readValue(reviewJson, Review.class);
            Review savedReview = reviewService.submitReview(review, images);
            return ResponseEntity.ok(savedReview);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of(
                            "error", "Bad Request",
                            "message", "Failed to submit review: " + e.getMessage()));
        }
    }
}
