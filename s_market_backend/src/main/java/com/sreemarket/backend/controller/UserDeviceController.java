package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.UserDevice;
import com.sreemarket.backend.service.UserDeviceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/devices")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserDeviceController {

    @Autowired
    private UserDeviceService userDeviceService;

    @GetMapping("/{userId}/{roleId}")
    public ResponseEntity<List<UserDevice>> getDevices(@PathVariable Long userId, @PathVariable Long roleId) {
        List<UserDevice> devices = userDeviceService.getDevicesForUser(userId, roleId);
        return ResponseEntity.ok(devices);
    }

    @DeleteMapping("/{deviceId}")
    public ResponseEntity<?> logoutDevice(
            @PathVariable Long deviceId,
            @RequestParam Long userId,
            @RequestParam Long roleId) {
        try {
            userDeviceService.logoutDevice(deviceId, userId, roleId);
            return ResponseEntity.ok(Map.of("message", "Device logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
