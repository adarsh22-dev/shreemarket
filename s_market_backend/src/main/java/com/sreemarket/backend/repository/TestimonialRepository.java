package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Testimonial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestimonialRepository extends JpaRepository<Testimonial, Long> {
    List<Testimonial> findByActiveTrueOrderBySortOrderAscCreatedAtDesc();
    List<Testimonial> findAllByOrderBySortOrderAscCreatedAtDesc();
    boolean existsByReviewId(Long reviewId);

    // Soft-delete queries
    List<Testimonial> findByDeletedTrue();
    List<Testimonial> findByDeletedTrueAndReviewerNameContainingIgnoreCase(String name);
    long countByDeletedTrue();
    List<Testimonial> findAllByDeletedTrueAndDeletedAtLessThan(Long deletedAt);
}
