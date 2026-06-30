package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Testimonial;
import com.sreemarket.backend.service.TestimonialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TestimonialController {

    @Autowired
    private TestimonialService testimonialService;

    @GetMapping("/testimonials/active")
    public ResponseEntity<List<Testimonial>> getActiveTestimonials() {
        return ResponseEntity.ok(testimonialService.getActiveTestimonials());
    }

    @GetMapping("/admin/testimonials")
    public ResponseEntity<List<Testimonial>> getAllTestimonials() {
        return ResponseEntity.ok(testimonialService.getAllTestimonials());
    }

    @PostMapping("/admin/testimonials")
    public ResponseEntity<?> addTestimonial(@RequestBody Map<String, Long> body) {
        try {
            Long reviewId = body.get("reviewId");
            Testimonial testimonial = testimonialService.addTestimonialFromReview(reviewId);
            return ResponseEntity.ok(testimonial);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/testimonials/{id}/toggle")
    public ResponseEntity<?> toggleActive(@PathVariable Long id) {
        try {
            Testimonial testimonial = testimonialService.toggleActive(id);
            return ResponseEntity.ok(testimonial);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/testimonials/{id}/sort-order")
    public ResponseEntity<?> updateSortOrder(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        try {
            Testimonial testimonial = testimonialService.updateSortOrder(id, body.get("sortOrder"));
            return ResponseEntity.ok(testimonial);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/testimonials/{id}")
    public ResponseEntity<?> deleteTestimonial(@PathVariable Long id) {
        try {
            testimonialService.deleteTestimonial(id);
            return ResponseEntity.ok(Map.of("message", "Testimonial deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
