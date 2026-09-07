package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {
    // Soft-delete queries
    List<Banner> findByDeletedTrue();
    List<Banner> findByDeletedTrueAndTitleContainingIgnoreCase(String title);
    long countByDeletedTrue();
    List<Banner> findAllByDeletedTrueAndDeletedAtLessThan(Long deletedAt);
}