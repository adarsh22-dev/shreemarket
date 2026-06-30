package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.WholesaleRFQ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WholesaleRFQRepository extends JpaRepository<WholesaleRFQ, Long> {
    List<WholesaleRFQ> findByWholesalerIdOrderByCreatedAtDesc(Long wholesalerId);
    List<WholesaleRFQ> findByVendorIdOrderByCreatedAtDesc(Long vendorId);
    List<WholesaleRFQ> findByVendorIdAndStatusOrderByCreatedAtDesc(Long vendorId, String status);
    long countByVendorIdAndStatus(Long vendorId, String status);
}
