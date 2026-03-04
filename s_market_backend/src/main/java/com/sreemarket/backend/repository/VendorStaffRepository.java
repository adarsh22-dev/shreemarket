package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.VendorStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorStaffRepository extends JpaRepository<VendorStaff, Long> {
    List<VendorStaff> findByVendorId(Long vendorId);

    VendorStaff findByUsername(String username);
}
