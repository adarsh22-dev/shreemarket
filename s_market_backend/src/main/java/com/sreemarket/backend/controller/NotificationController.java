package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Notification;
import com.sreemarket.backend.service.NotificationService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<?> getVendorNotifications(
            @PathVariable Long vendorId,
            @RequestParam(required = false) String type,
            HttpServletRequest request) {
        if (!AuthUtil.isOwnerOrAdmin(vendorId, request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
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
    public ResponseEntity<?> markAllAsRead(@PathVariable Long vendorId, HttpServletRequest request) {
        if (!AuthUtil.isOwnerOrAdmin(vendorId, request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        notificationService.markAllAsRead(vendorId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody Notification notification, HttpServletRequest request) {
        if (!AuthUtil.isAdmin()) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(notificationService.createNotification(notification));
    }
}
