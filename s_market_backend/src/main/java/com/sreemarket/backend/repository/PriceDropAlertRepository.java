package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.PriceDropAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PriceDropAlertRepository extends JpaRepository<PriceDropAlert, Long> {
    List<PriceDropAlert> findByUserId(Long userId);
    List<PriceDropAlert> findByProductIdAndStatus(Long productId, String status);
    List<PriceDropAlert> findByStatus(String status);
    boolean existsByProductIdAndUserIdAndStatus(Long productId, Long userId, String status);
}
