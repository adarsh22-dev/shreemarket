package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.LoyaltyCustomer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoyaltyCustomerRepository extends JpaRepository<LoyaltyCustomer, Long> {
    Optional<LoyaltyCustomer> findByUserId(Long userId);
    Optional<LoyaltyCustomer> findByEmail(String email);
}
