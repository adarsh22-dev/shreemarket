package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.VendorShipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VendorShipmentRepository extends JpaRepository<VendorShipment, Long> {}
