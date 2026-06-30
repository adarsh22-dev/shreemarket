package com.sreemarket.backend.controller;

import com.sreemarket.backend.service.AnalyticsService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
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
    public ResponseEntity<?> getVendorAnalytics(@PathVariable Long vendorId, HttpServletRequest request) {
        if (!AuthUtil.isOwnerOrAdmin(vendorId, request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(analyticsService.getVendorAnalytics(vendorId));
    }

    /**
     * GET /api/analytics/vendor/{vendorId}/demographics
     * Returns enriched customer demographics including location, device, and customer insights.
     */
    @GetMapping("/vendor/{vendorId}/demographics")
    public ResponseEntity<?> getVendorDemographics(@PathVariable Long vendorId, HttpServletRequest request) {
        if (!AuthUtil.isOwnerOrAdmin(vendorId, request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(analyticsService.getVendorDemographics(vendorId));
    }

    /**
     * GET /api/analytics/vendor/{vendorId}/products/{productId}
     * Returns detailed product-level analytics for a specific product.
     */
    @GetMapping("/vendor/{vendorId}/products/{productId}")
    public ResponseEntity<?> getVendorProductAnalytics(
            @PathVariable Long vendorId,
            @PathVariable Long productId,
            HttpServletRequest request) {
        if (!AuthUtil.isOwnerOrAdmin(vendorId, request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        try {
            return ResponseEntity.ok(analyticsService.getProductAnalytics(vendorId, productId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
