package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.WholesalerProductOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WholesalerProductOverrideRepository extends JpaRepository<WholesalerProductOverride, Long> {
    List<WholesalerProductOverride> findByWholesalerId(Long wholesalerId);
    List<WholesalerProductOverride> findByProductId(Long productId);
    Optional<WholesalerProductOverride> findByWholesalerIdAndProductId(Long wholesalerId, Long productId);
    void deleteByWholesalerIdAndProductId(Long wholesalerId, Long productId);
}
