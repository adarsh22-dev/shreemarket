package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.BulkPricingTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BulkPricingTierRepository extends JpaRepository<BulkPricingTier, Long> {
    List<BulkPricingTier> findByProductIdOrderBySortOrderAsc(Long productId);
    void deleteByProductId(Long productId);
}
