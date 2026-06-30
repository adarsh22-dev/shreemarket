package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.VendorActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorActivityRepository extends JpaRepository<VendorActivity, Long> {
    List<VendorActivity> findByVendorIdOrderByTimestampDesc(Long vendorId);

    Page<VendorActivity> findAllByOrderByTimestampDesc(Pageable pageable);

    Page<VendorActivity> findByVendorIdOrderByTimestampDesc(Long vendorId, Pageable pageable);

    Page<VendorActivity> findByActionContainingIgnoreCaseOrVendorNameContainingIgnoreCaseOrDetailsContainingIgnoreCase(
            String action, String vendorName, String details, Pageable pageable);
}
