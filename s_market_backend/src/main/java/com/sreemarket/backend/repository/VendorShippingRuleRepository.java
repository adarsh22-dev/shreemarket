package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.VendorShippingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorShippingRuleRepository extends JpaRepository<VendorShippingRule, Long> {
    List<VendorShippingRule> findByVendorIdOrderBySortOrderAsc(Long vendorId);
    List<VendorShippingRule> findByVendorIdAndIsActiveTrueOrderBySortOrderAsc(Long vendorId);
    List<VendorShippingRule> findByIsActiveTrueOrderBySortOrderAsc();
}
