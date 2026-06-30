package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.VendorPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorPlanRepository extends JpaRepository<VendorPlan, Long> {
    List<VendorPlan> findByActiveTrue();
}
