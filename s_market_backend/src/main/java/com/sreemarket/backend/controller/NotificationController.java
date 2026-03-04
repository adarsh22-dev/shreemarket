package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Notification;
import com.sreemarket.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<Notification>> getVendorNotifications(
            @PathVariable Long vendorId,
            @RequestParam(required = false) String type) {
        if (type != null && !type.isEmpty() && !"All".equalsIgnoreCase(type)) {
            return ResponseEntity.ok(notificationService.getNotificationsByVendorAndType(vendorId, type));
        }
        return ResponseEntity.ok(notificationService.getNotificationsByVendor(vendorId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }

    @PutMapping("/vendor/{vendorId}/read-all")
    public ResponseEntity<?> markAllAsRead(@PathVariable Long vendorId) {
        notificationService.markAllAsRead(vendorId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        return ResponseEntity.ok(notificationService.createNotification(notification));
    }
}
