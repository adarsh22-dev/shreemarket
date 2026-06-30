package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Review;
import com.sreemarket.backend.model.Testimonial;
import com.sreemarket.backend.repository.ReviewRepository;
import com.sreemarket.backend.repository.TestimonialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TestimonialService {

    @Autowired
    private TestimonialRepository testimonialRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    public List<Testimonial> getActiveTestimonials() {
        return testimonialRepository.findByActiveTrueOrderBySortOrderAscCreatedAtDesc();
    }

    public List<Testimonial> getAllTestimonials() {
        return testimonialRepository.findAllByOrderBySortOrderAscCreatedAtDesc();
    }

    public Testimonial addTestimonialFromReview(Long reviewId) {
        if (testimonialRepository.existsByReviewId(reviewId)) {
            throw new RuntimeException("Testimonial already exists for this review");
        }
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));
        Testimonial testimonial = new Testimonial(review);
        return testimonialRepository.save(testimonial);
    }

    public Testimonial toggleActive(Long id) {
        Testimonial testimonial = testimonialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Testimonial not found with id: " + id));
        testimonial.setActive(!Boolean.TRUE.equals(testimonial.getActive()));
        return testimonialRepository.save(testimonial);
    }

    public Testimonial updateSortOrder(Long id, Integer sortOrder) {
        Testimonial testimonial = testimonialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Testimonial not found with id: " + id));
        testimonial.setSortOrder(sortOrder);
        return testimonialRepository.save(testimonial);
    }

    public void deleteTestimonial(Long id) {
        if (!testimonialRepository.existsById(id)) {
            throw new RuntimeException("Testimonial not found");
        }
        testimonialRepository.deleteById(id);
    }
}
