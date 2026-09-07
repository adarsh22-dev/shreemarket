package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.FlashSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashSaleRepository extends JpaRepository<FlashSale, Long> {
    // Soft-delete queries
    List<FlashSale> findByDeletedTrue();
    List<FlashSale> findByDeletedTrueAndNameContainingIgnoreCase(String name);
    long countByDeletedTrue();
    List<FlashSale> findAllByDeletedTrueAndDeletedAtLessThan(Long deletedAt);
}