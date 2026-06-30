package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.InventoryAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InventoryAlertRepository extends JpaRepository<InventoryAlert, Long> {
    List<InventoryAlert> findByStatusOrderByCreatedAtDesc(String status);
    List<InventoryAlert> findByVendorIdOrderByCreatedAtDesc(Long vendorId);
    List<InventoryAlert> findBySeverityOrderByCreatedAtDesc(String severity);
    List<InventoryAlert> findByProductIdOrderByCreatedAtDesc(Long productId);
    long countByStatus(String status);
    long countBySeverity(String severity);
}
