package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.VendorStaff;
import com.sreemarket.backend.service.VendorStaffService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/vendor-staff")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorStaffController {

    @Autowired
    private VendorStaffService vendorStaffService;

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<?> getStaffByVendorId(@PathVariable Long vendorId, HttpServletRequest request) {
        if (!AuthUtil.isOwnerOrAdmin(vendorId, request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(vendorStaffService.getStaffByVendorId(vendorId));
    }

    @PostMapping
    public ResponseEntity<?> createStaff(@RequestBody VendorStaff staff, HttpServletRequest request) {
        try {
            if (!AuthUtil.isAdmin() && !AuthUtil.isVendor()) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            VendorStaff created = vendorStaffService.createStaff(staff);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to create new staff. Username might already exist."));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStaff(@PathVariable Long id, @RequestBody VendorStaff staffDetails, HttpServletRequest request) {
        if (!AuthUtil.isAdmin() && !AuthUtil.isVendor()) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        VendorStaff updated = vendorStaffService.updateStaff(id, staffDetails);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable Long id, HttpServletRequest request) {
        if (!AuthUtil.isAdmin() && !AuthUtil.isVendor()) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        vendorStaffService.deleteStaff(id);
        return ResponseEntity.ok(Map.of("message", "Staff deleted successfully"));
    }
}
