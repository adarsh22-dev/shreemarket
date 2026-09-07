package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findByVendorId(Long vendorId);

    // Soft-delete queries
    List<Coupon> findByDeletedTrue();
    List<Coupon> findByDeletedTrueAndCodeContainingIgnoreCase(String code);
    long countByDeletedTrue();
    List<Coupon> findAllByDeletedTrueAndDeletedAtLessThan(Long deletedAt);
}
