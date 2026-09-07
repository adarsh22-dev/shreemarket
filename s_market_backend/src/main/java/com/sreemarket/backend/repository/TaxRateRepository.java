package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaxRateRepository extends JpaRepository<TaxRate, Long> {
    List<TaxRate> findByStatus(String status);
    List<TaxRate> findByIsDefaultTrue();

    // Soft-delete queries
    List<TaxRate> findByDeletedTrue();
    List<TaxRate> findByDeletedTrueAndNameContainingIgnoreCase(String name);
    long countByDeletedTrue();
    List<TaxRate> findAllByDeletedTrueAndDeletedAtLessThan(Long deletedAt);
}
