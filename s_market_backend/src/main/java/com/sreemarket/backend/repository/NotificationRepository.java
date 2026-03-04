package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByVendorIdOrderByCreatedAtDesc(Long vendorId);

    List<Notification> findByVendorIdAndTypeOrderByCreatedAtDesc(Long vendorId, String type);
}
