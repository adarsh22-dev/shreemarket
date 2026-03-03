package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByDatePlacedDesc(Long userId);

    List<Order> findByVendorIdOrderByDatePlacedDesc(Long vendorId);
}
