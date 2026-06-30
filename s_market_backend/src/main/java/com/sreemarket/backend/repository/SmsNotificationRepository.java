package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.SmsNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmsNotificationRepository extends JpaRepository<SmsNotification, Long> {
    List<SmsNotification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<SmsNotification> findByStatus(String status);

    long countByStatus(String status);
}
