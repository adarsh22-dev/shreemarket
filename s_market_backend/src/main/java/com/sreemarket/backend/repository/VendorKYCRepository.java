package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.VendorKYC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorKYCRepository extends JpaRepository<VendorKYC, Long> {
    List<VendorKYC> findByVendorNameContainingIgnoreCase(String search);

    @Query("SELECT k FROM VendorKYC k WHERE " +
            "LOWER(k.vendorName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<VendorKYC> searchKyc(@Param("search") String search, Pageable pageable);

    Optional<VendorKYC> findByVendorId(Long vendorId);
}
