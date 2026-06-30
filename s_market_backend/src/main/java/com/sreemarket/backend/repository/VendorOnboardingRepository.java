package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.VendorOnboarding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorOnboardingRepository extends JpaRepository<VendorOnboarding, Long> {
    List<VendorOnboarding> findByVendorId(Long vendorId);
}
