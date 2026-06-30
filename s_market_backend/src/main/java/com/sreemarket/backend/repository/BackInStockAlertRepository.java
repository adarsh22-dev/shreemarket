package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.BackInStockAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BackInStockAlertRepository extends JpaRepository<BackInStockAlert, Long> {
    List<BackInStockAlert> findByUserId(Long userId);
    List<BackInStockAlert> findByProductIdAndStatus(Long productId, String status);
    List<BackInStockAlert> findByStatus(String status);
    List<BackInStockAlert> findByProductId(Long productId);
    boolean existsByProductIdAndUserIdAndStatus(Long productId, Long userId, String status);
}
