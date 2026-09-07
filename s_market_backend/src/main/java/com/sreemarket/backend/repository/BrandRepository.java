package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {
    // Soft-delete queries
    List<Brand> findByDeletedTrue();
    List<Brand> findByDeletedTrueAndNameContainingIgnoreCase(String name);
    long countByDeletedTrue();
    List<Brand> findAllByDeletedTrueAndDeletedAtLessThan(Long deletedAt);
}