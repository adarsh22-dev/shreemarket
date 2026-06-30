package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.OrderFulfillment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderFulfillmentRepository extends JpaRepository<OrderFulfillment, Long> {
    List<OrderFulfillment> findByOrderIdOrderByCreatedAtDesc(Long orderId);
    List<OrderFulfillment> findByVendorIdOrderByCreatedAtDesc(Long vendorId);
}
