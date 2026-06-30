package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.WholesaleTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WholesaleTierRepository extends JpaRepository<WholesaleTier, Long> {
    List<WholesaleTier> findByProductIdOrderByMinQtyAsc(Long productId);
}
