package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.VendorSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorSubscriptionRepository extends JpaRepository<VendorSubscription, Long> {
    Optional<VendorSubscription> findTopByVendorIdOrderByStartDateDesc(Long vendorId);
}
