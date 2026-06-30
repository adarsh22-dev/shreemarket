package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.ProductSchedule;
import com.sreemarket.backend.service.ProductSchedulingService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/vendor/product-schedules")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorProductScheduleController {

    @Autowired
    private ProductSchedulingService productSchedulingService;

    @GetMapping
    public ResponseEntity<?> getSchedules(HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        return ResponseEntity.ok(productSchedulingService.getVendorSchedules(vendorId));
    }

    @PostMapping
    public ResponseEntity<?> createSchedule(@RequestBody ProductSchedule schedule, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        schedule.setVendorId(vendorId);
        return ResponseEntity.ok(productSchedulingService.createSchedule(schedule));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSchedule(@PathVariable Long id, @RequestBody ProductSchedule schedule, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        return ResponseEntity.ok(productSchedulingService.updateSchedule(id, schedule));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSchedule(@PathVariable Long id, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        productSchedulingService.deleteSchedule(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
