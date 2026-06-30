package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.AbandonedCart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AbandonedCartRepository extends JpaRepository<AbandonedCart, Long> {
    List<AbandonedCart> findByStatus(String status);
    Optional<AbandonedCart> findByCartIdAndStatus(Long cartId, String status);
    long countByStatus(String status);
    List<AbandonedCart> findByUserIdAndStatus(Long userId, String status);
}
