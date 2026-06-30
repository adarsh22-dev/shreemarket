package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.VendorFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorFollowRepository extends JpaRepository<VendorFollow, Long> {
    List<VendorFollow> findByUserId(Long userId);
    List<VendorFollow> findByVendorId(Long vendorId);
    Optional<VendorFollow> findByUserIdAndVendorId(Long userId, Long vendorId);
    boolean existsByUserIdAndVendorId(Long userId, Long vendorId);
    long countByVendorId(Long vendorId);
    long countByUserId(Long userId);
    void deleteByUserIdAndVendorId(Long userId, Long vendorId);
}
