package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Review;
import com.sreemarket.backend.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    private final String REVIEW_UPLOAD_DIR = "uploads/reviews/";

    public List<Review> getReviewsForProduct(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public List<Review> getReviewsByUser(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Review submitReview(Review review, List<MultipartFile> images) throws java.io.IOException {
        if (images != null && !images.isEmpty()) {
            File uploadDirectory = new File(REVIEW_UPLOAD_DIR);
            if (!uploadDirectory.exists()) {
                uploadDirectory.mkdirs();
            }

            for (MultipartFile file : images) {
                if (!file.isEmpty()) {
                    String fileName = java.util.UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                    java.nio.file.Path filePath = java.nio.file.Paths.get(REVIEW_UPLOAD_DIR, fileName);
                    java.nio.file.Files.copy(file.getInputStream(), filePath);
                    review.getImages().add(fileName);
                }
            }
        }
        return reviewRepository.save(review);
    }
}
