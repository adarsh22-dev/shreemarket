package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Notification;
import com.sreemarket.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getNotificationsByVendor(Long vendorId) {
        return notificationRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);
    }

    public List<Notification> getNotificationsByVendorAndType(Long vendorId, String type) {
        if ("All".equalsIgnoreCase(type)) {
            return getNotificationsByVendor(vendorId);
        }
        if ("STOCK".equalsIgnoreCase(type)) {
            return notificationRepository.findByVendorIdAndTypeInOrderByCreatedAtDesc(vendorId,
                    List.of("LOW_STOCK", "OUT_OF_STOCK"));
        }
        return notificationRepository.findByVendorIdAndTypeOrderByCreatedAtDesc(vendorId, type.toUpperCase());
    }

    public Notification createNotification(Notification notification) {
        if (notification.getCreatedAt() == null) {
            notification.setCreatedAt(System.currentTimeMillis());
        }
        return notificationRepository.save(notification);
    }

    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setUnread(false);
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(Long vendorId) {
        List<Notification> notifications = notificationRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);
        notifications.forEach(n -> n.setUnread(false));
        notificationRepository.saveAll(notifications);
    }
}
