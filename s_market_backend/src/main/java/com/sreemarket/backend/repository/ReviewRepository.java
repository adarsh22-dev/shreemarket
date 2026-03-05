package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long>, JpaSpecificationExecutor<Review> {
    List<Review> findByProductId(Long productId); // This will need @Query if column name differs or just renamed

    @Query("SELECT r FROM Review r WHERE r.product.id = :productId ORDER BY r.createdAt DESC")
    List<Review> findByProductIdOrderByCreatedAtDesc(@Param("productId") Long productId);

    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT r FROM Review r WHERE r.product.vendorId = :vendorId")
    Page<Review> findByVendorId(@Param("vendorId") Long vendorId, Pageable pageable);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.product.vendorId = :vendorId GROUP BY r.rating")
    List<Object[]> countReviewsByRatingForVendor(@Param("vendorId") Long vendorId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.vendorId = :vendorId AND r.vendorReply IS NULL")
    long countPendingReviewsForVendor(@Param("vendorId") Long vendorId);
}
