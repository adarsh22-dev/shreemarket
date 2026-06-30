package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.ProductSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductScheduleRepository extends JpaRepository<ProductSchedule, Long> {
    List<ProductSchedule> findByVendorIdOrderByCreatedAtDesc(Long vendorId);
    List<ProductSchedule> findByProductId(Long productId);
    List<ProductSchedule> findByPublishedFalseAndPublishAtLessThanEqual(Long now);
    List<ProductSchedule> findByPublishedTrueAndUnpublishAtLessThanEqual(Long now);
}
