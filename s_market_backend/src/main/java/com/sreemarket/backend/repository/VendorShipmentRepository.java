package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.VendorShipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorShipmentRepository extends JpaRepository<VendorShipment, Long> {
    List<VendorShipment> findByOrderIdIn(List<String> orderIds);
}
