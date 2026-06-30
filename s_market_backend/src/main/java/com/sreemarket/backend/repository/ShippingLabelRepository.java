package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.ShippingLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShippingLabelRepository extends JpaRepository<ShippingLabel, Long> {
    List<ShippingLabel> findByVendorIdOrderByCreatedAtDesc(Long vendorId);
    List<ShippingLabel> findByOrderId(Long orderId);
    Optional<ShippingLabel> findByAwbNumber(String awbNumber);
    List<ShippingLabel> findByVendorIdAndStatusOrderByCreatedAtDesc(Long vendorId, String status);
}
