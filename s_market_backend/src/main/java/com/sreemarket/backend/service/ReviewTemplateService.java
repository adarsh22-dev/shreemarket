package com.sreemarket.backend.service;

import com.sreemarket.backend.model.ReviewTemplate;
import com.sreemarket.backend.repository.ReviewTemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewTemplateService {

    @Autowired
    private ReviewTemplateRepository reviewTemplateRepository;

    public List<ReviewTemplate> getTemplates(Long vendorId) {
        return reviewTemplateRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);
    }

    public ReviewTemplate createTemplate(ReviewTemplate template) {
        template.setCreatedAt(System.currentTimeMillis());
        template.setUpdatedAt(System.currentTimeMillis());
        return reviewTemplateRepository.save(template);
    }

    public ReviewTemplate updateTemplate(Long id, ReviewTemplate updated) {
        ReviewTemplate existing = reviewTemplateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        existing.setTitle(updated.getTitle());
        existing.setContent(updated.getContent());
        existing.setRatingFilter(updated.getRatingFilter());
        existing.setDefault(updated.isDefault());
        existing.setUpdatedAt(System.currentTimeMillis());
        return reviewTemplateRepository.save(existing);
    }

    public void deleteTemplate(Long id) {
        reviewTemplateRepository.deleteById(id);
    }
}
