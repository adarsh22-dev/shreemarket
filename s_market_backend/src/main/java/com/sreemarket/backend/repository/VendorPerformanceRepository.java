package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.VendorPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorPerformanceRepository extends JpaRepository<VendorPerformance, Long> {
    Optional<VendorPerformance> findByVendorId(Long vendorId);
}
