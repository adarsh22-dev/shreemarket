package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Review;
import com.sreemarket.backend.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.criteria.Join;
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

// Assuming Product model exists and Review has a 'product' field (or productId that can be joined)
// If Review.java has `private Long productId;` and not a `Product product;` entity relationship,
// then `root.join("product")` will fail.
// For this to work, Review entity must have a ManyToOne relationship to Product:
// @ManyToOne
// @JoinColumn(name = "product_id") // or whatever your foreign key column is
// private Product product;
// If not, the Specification logic for productJoin.get("vendorId") and productJoin.get("name") will need adjustment.
// For the purpose of this edit, I'm assuming the `Review` entity has a `product` field of type `Product`.
import com.sreemarket.backend.model.Product; // Assuming Product model exists

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

    public Page<Review> getVendorReviews(Long vendorId, Integer rating, String status, String search,
            Pageable pageable) {
        Specification<Review> spec = (root, query, cb) -> {
            Join<Review, Product> productJoin = root.join("product");
            jakarta.persistence.criteria.Predicate predicate = cb.conjunction();

            // Filter by vendor
            predicate = cb.and(predicate, cb.equal(productJoin.get("vendorId"), vendorId));

            // Filter by rating
            if (rating != null) {
                predicate = cb.and(predicate, cb.equal(root.get("rating"), rating));
            }

            // Filter by status
            if (status != null && !status.equals("All")) {
                if (status.equalsIgnoreCase("Replied")) {
                    predicate = cb.and(predicate, cb.isNotNull(root.get("vendorReply")));
                } else if (status.equalsIgnoreCase("Pending")) {
                    predicate = cb.and(predicate, cb.isNull(root.get("vendorReply")));
                }
            }

            // Search by reviewer name or text or product name
            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                jakarta.persistence.criteria.Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(root.get("reviewerName")), searchPattern),
                        cb.like(cb.lower(root.get("text")), searchPattern),
                        cb.like(cb.lower(productJoin.get("name")), searchPattern));
                predicate = cb.and(predicate, searchPredicate);
            }

            return predicate;
        };

        return reviewRepository.findAll(spec, pageable);
    }

    public Review addVendorReply(Long reviewId, String reply) {
        Optional<Review> reviewOpt = reviewRepository.findById(reviewId);
        if (reviewOpt.isPresent()) {
            Review review = reviewOpt.get();
            review.setVendorReply(reply);
            review.setReplyDate(System.currentTimeMillis());
            return reviewRepository.save(review);
        }
        throw new RuntimeException("Review not found with id: " + reviewId);
    }

    public java.util.Map<String, Object> getVendorReviewStats(Long vendorId) {
        List<Object[]> results = reviewRepository.countReviewsByRatingForVendor(vendorId);
        long pendingCount = reviewRepository.countPendingReviewsForVendor(vendorId);

        long totalReviews = 0;
        double totalRatingSum = 0;
        long[] distribution = new long[6]; // index 1-5 for stars

        for (Object[] result : results) {
            Integer rating = (Integer) result[0];
            Long count = (Long) result[1];
            if (rating >= 1 && rating <= 5) {
                distribution[rating] = count;
                totalReviews += count;
                totalRatingSum += (rating * count);
            }
        }

        double averageRating = totalReviews > 0 ? totalRatingSum / totalReviews : 0.0;
        List<java.util.Map<String, Object>> distributionList = new java.util.ArrayList<>();
        for (int i = 5; i >= 1; i--) {
            java.util.Map<String, Object> distMap = new java.util.HashMap<>();
            distMap.put("stars", i);
            distMap.put("count", distribution[i]);
            distMap.put("pct", totalReviews > 0 ? (distribution[i] * 100.0 / totalReviews) : 0.0);
            distributionList.add(distMap);
        }

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("averageRating", averageRating);
        stats.put("totalReviews", totalReviews);
        stats.put("pendingReviews", pendingCount);
        stats.put("distribution", distributionList);

        return stats;
    }

    public Review submitReview(Review review, List<MultipartFile> images) throws IOException {
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
