package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.ShippingZone;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShippingZoneRepository extends JpaRepository<ShippingZone, Long> {
    List<ShippingZone> findByIsActiveTrue();
    List<ShippingZone> findByDeliveryType(String deliveryType);
}
