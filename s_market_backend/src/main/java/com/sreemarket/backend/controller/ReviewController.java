package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Review;
import com.sreemarket.backend.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getProductReviews(@PathVariable Long productId) {
        List<Review> reviews = reviewService.getReviewsForProduct(productId);
        return ResponseEntity.ok(reviews);
    }

    @PostMapping
    public ResponseEntity<Review> submitReview(@RequestBody Review review) {
        try {
            Review savedReview = reviewService.submitReview(review);
            return ResponseEntity.ok(savedReview);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
