package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.CompetitorPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitorPriceRepository extends JpaRepository<CompetitorPrice, Long> {
    List<CompetitorPrice> findByProductId(Long productId);
    void deleteByProductId(Long productId);
}
