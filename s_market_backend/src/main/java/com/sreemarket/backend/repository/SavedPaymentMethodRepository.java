package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.SavedPaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SavedPaymentMethodRepository extends JpaRepository<SavedPaymentMethod, Long> {
    List<SavedPaymentMethod> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<SavedPaymentMethod> findByUserIdAndIsActiveTrue(Long userId);
    List<SavedPaymentMethod> findByUserIdAndType(Long userId, String type);
}
