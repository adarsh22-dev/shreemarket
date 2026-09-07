package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    // Soft-delete queries
    List<BlogPost> findByDeletedTrue();
    List<BlogPost> findByDeletedTrueAndTitleContainingIgnoreCase(String title);
    long countByDeletedTrue();
    List<BlogPost> findAllByDeletedTrueAndDeletedAtLessThan(Long deletedAt);
}