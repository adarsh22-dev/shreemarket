package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.ReviewTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewTemplateRepository extends JpaRepository<ReviewTemplate, Long> {
    List<ReviewTemplate> findByVendorIdOrderByCreatedAtDesc(Long vendorId);
}
