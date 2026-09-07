package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Faq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaqRepository extends JpaRepository<Faq, Long> {
    // Soft-delete queries
    List<Faq> findByDeletedTrue();
    List<Faq> findByDeletedTrueAndQuestionContainingIgnoreCase(String question);
    long countByDeletedTrue();
    List<Faq> findAllByDeletedTrueAndDeletedAtLessThan(Long deletedAt);
}