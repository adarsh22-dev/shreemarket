package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Payout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.domain.Pageable;

@Repository
public interface PayoutRepository extends JpaRepository<Payout, Long> {
    List<Payout> findByStatus(String status);
    List<Payout> findByVendorNameContainingIgnoreCase(String search);
    List<Payout> findAllByOrderByDateDesc(Pageable pageable);
    List<Payout> findByVendorId(Long vendorId);
    List<Payout> findByVendorIdAndStatus(Long vendorId, String status);
}
