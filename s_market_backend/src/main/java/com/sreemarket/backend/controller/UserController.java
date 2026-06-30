package com.sreemarket.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.sreemarket.backend.service.VendorService;
import com.sreemarket.backend.service.UserService;
import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.model.User;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserController {

    @Autowired
    private VendorService vendorService;

    @Autowired
    private UserService userService;

    @GetMapping("/vendors")
    public ResponseEntity<?> getVendors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Page<Vendor> vendors = vendorService.getVendors(search, status, page, size, sortDir, sortBy);
            return ResponseEntity.ok(vendors);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/vendors/{id}")
    public ResponseEntity<?> updateVendor(@PathVariable Long id, @RequestBody Vendor updated, HttpServletRequest request) {
        try {
            if (!AuthUtil.isOwnerOrAdmin(id, request) && !AuthUtil.isAdmin()) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            Vendor saved = vendorService.updateVendor(id, updated);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/vendors/{id}/status")
    public ResponseEntity<?> updateVendorStatus(@PathVariable Long id, @RequestBody Map<String, String> statusBody) {
        try {
            String newStatus = statusBody.get("status");
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            Vendor updatedVendor = vendorService.updateVendorStatus(id, newStatus);
            return ResponseEntity.ok(updatedVendor);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/vendors/{id}")
    public ResponseEntity<?> deleteVendor(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String password = body.get("password");
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required for account deletion"));
            }
            vendorService.deleteVendor(id, password);
            return ResponseEntity.ok(Map.of("message", "Vendor deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/vendors/{id}")
    public ResponseEntity<?> getVendorById(@PathVariable Long id) {
        try {
            Vendor vendor = vendorService.getVendorById(id);
            vendor.setPassword(null);
            return ResponseEntity.ok(vendor);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserDetails(@PathVariable Long id, HttpServletRequest request) {
        try {
            if (!AuthUtil.isOwnerOrAdmin(id, request)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            User user = userService.getUserById(id);
            // Mask password in response
            user.setPassword(null);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUserDetails(@PathVariable Long id, @RequestBody User updatedUser, HttpServletRequest request) {
        try {
            if (!AuthUtil.isOwnerOrAdmin(id, request)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            User savedUser = userService.updateUser(id, updatedUser);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<?> updateUserPassword(@PathVariable Long id, @RequestBody Map<String, String> passwordData, HttpServletRequest request) {
        try {
            if (!AuthUtil.isOwnerOrAdmin(id, request)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            String currentPassword = passwordData.get("currentPassword");
            String newPassword = passwordData.get("newPassword");
            if (newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
            }
            userService.changePassword(id, currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/vendors/{id}/store-details")
    public ResponseEntity<?> getStoreDetails(@PathVariable Long id, HttpServletRequest request) {
        try {
            if (!AuthUtil.isOwnerOrAdmin(id, request)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            String settings = vendorService.getStoreDetails(id);
            return ResponseEntity.ok(Map.of("settings", settings != null ? settings : "{}"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/vendors/{id}/store-details")
    public ResponseEntity<?> saveStoreDetails(@PathVariable Long id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        try {
            if (!AuthUtil.isOwnerOrAdmin(id, request)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            String settingsJson = body.get("settings");
            if (settingsJson == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Settings data is required"));
            }
            vendorService.saveStoreDetails(id, settingsJson);
            return ResponseEntity.ok(Map.of("message", "Store details saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/vendors/{id}/password")
    public ResponseEntity<?> updateVendorPassword(@PathVariable Long id,
            @RequestBody Map<String, String> passwordData, HttpServletRequest request) {
        try {
            if (!AuthUtil.isOwnerOrAdmin(id, request)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            String currentPassword = passwordData.get("currentPassword");
            String newPassword = passwordData.get("newPassword");
            if (newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
            }
            vendorService.changePassword(id, currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        try {
            if (!AuthUtil.isOwnerOrAdmin(id, request)) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            String password = body.get("password");
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required for account deletion"));
            }
            userService.deleteUser(id, password);
            return ResponseEntity.ok(Map.of("message", "User account deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
