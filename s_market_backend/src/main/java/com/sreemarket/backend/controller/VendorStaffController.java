package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.VendorStaff;
import com.sreemarket.backend.service.VendorStaffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendor-staff")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorStaffController {

    @Autowired
    private VendorStaffService vendorStaffService;

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<VendorStaff>> getStaffByVendorId(@PathVariable Long vendorId) {
        return ResponseEntity.ok(vendorStaffService.getStaffByVendorId(vendorId));
    }

    @PostMapping
    public ResponseEntity<?> createStaff(@RequestBody VendorStaff staff) {
        try {
            VendorStaff created = vendorStaffService.createStaff(staff);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("{\"error\": \"Failed to create new staff. Username might already exist.\"}");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<VendorStaff> updateStaff(@PathVariable Long id, @RequestBody VendorStaff staffDetails) {
        VendorStaff updated = vendorStaffService.updateStaff(id, staffDetails);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable Long id) {
        vendorStaffService.deleteStaff(id);
        return ResponseEntity.ok().build();
    }
}
