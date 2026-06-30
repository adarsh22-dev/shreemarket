package com.sreemarket.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreemarket.backend.model.Review;
import com.sreemarket.backend.service.ReviewService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<?> getUserReviews(@PathVariable Long userId, HttpServletRequest request) {
        if (!AuthUtil.isOwnerOrAdmin(userId, request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        List<Review> reviews = reviewService.getReviewsByUser(userId);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<?> getVendorReviews(
            @PathVariable Long vendorId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir, HttpServletRequest request) {

        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<Review> reviews = reviewService.getVendorReviews(vendorId, rating, status, search, pageable);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of(
                    "error", "Internal Server Error",
                    "message", e.getMessage()));
        }
    }

    @GetMapping("/vendor/{vendorId}/stats")
    public ResponseEntity<?> getVendorReviewStats(@PathVariable Long vendorId) {
        try {
            java.util.Map<String, Object> stats = reviewService.getVendorReviewStats(vendorId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of(
                    "error", "Internal Server Error",
                    "message", e.getMessage()));
        }
    }

    @PostMapping("/{reviewId}/reply")
    public ResponseEntity<?> replyToReview(
            @PathVariable Long reviewId,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        try {
            if (!AuthUtil.isAdmin() && !AuthUtil.isVendor()) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            String reply = body.get("reply");
            if (reply == null || reply.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Reply is required"));
            }
            Review updatedReview = reviewService.addVendorReply(reviewId, reply);
            return ResponseEntity.ok(updatedReview);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping(consumes = { "multipart/form-data" })
    @CrossOrigin
    public ResponseEntity<?> submitReview(
            @RequestParam("review") String reviewJson,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "videos", required = false) List<MultipartFile> videos) {
        try {
            Review review = objectMapper.readValue(reviewJson, Review.class);
            if (review.getRating() == null || review.getRating() < 1 || review.getRating() > 5) {
                return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1 and 5"));
            }
            Review savedReview = (videos != null && !videos.isEmpty())
                ? reviewService.submitReview(review, images, videos)
                : reviewService.submitReview(review, images);
            return ResponseEntity.ok(savedReview);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of(
                            "error", "Bad Request",
                            "message", "Failed to submit review: " + e.getMessage()));
        }
    }
}
