package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByName(String name);
    List<Category> findByStatus(String status);
    List<Category> findByNameContainingIgnoreCase(String name);

    // Soft-delete queries
    List<Category> findByDeletedTrue();
    List<Category> findByDeletedTrueAndNameContainingIgnoreCase(String name);
    long countByDeletedTrue();
    List<Category> findAllByDeletedTrueAndDeletedAtLessThan(Long deletedAt);
}
