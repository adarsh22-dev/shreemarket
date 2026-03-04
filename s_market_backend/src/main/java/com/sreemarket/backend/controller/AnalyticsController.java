package com.sreemarket.backend.controller;

import com.sreemarket.backend.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<Map<String, Object>> getVendorAnalytics(@PathVariable Long vendorId) {
        return ResponseEntity.ok(analyticsService.getVendorAnalytics(vendorId));
    }
}
