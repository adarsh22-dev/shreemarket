package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Review;
import com.sreemarket.backend.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    public List<Review> getReviewsForProduct(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public Review submitReview(Review review) {
        return reviewRepository.save(review);
    }
}
