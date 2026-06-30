package com.sreemarket.backend.controller;

import com.sreemarket.backend.service.PincodeValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin endpoints for shipping pincode validation.
 * Mapped under /api/admin/shipping/ to match the existing SecurityConfig pattern:
 *   .requestMatchers("/api/admin/**").hasRole("ADMIN")
 */
@RestController
@RequestMapping("/api/admin/shipping")
public class AdminShippingController {

    @Autowired
    private PincodeValidationService pincodeValidationService;

    /**
     * POST /api/admin/shipping/clear-cache
     *
     * Clear cached validation results for a specific pincode.
     */
    @PostMapping("/clear-cache")
    public ResponseEntity<?> clearCache(@RequestBody Map<String, String> request) {
        try {
            String pincode = request.get("pincode");
            if (pincode == null || pincode.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Validation Error", "message", "pincode is required."));
            }
            pincodeValidationService.clearCacheForPincode(pincode.trim());
            return ResponseEntity.ok(Map.of("message", "Cache cleared for pincode: " + pincode));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Server Error", "message", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/shipping/purge-expired
     *
     * Purge all expired cache entries.
     */
    @PostMapping("/purge-expired")
    public ResponseEntity<?> purgeExpired() {
        try {
            int purged = pincodeValidationService.purgeExpiredCache();
            return ResponseEntity.ok(Map.of(
                "message", "Purged " + purged + " expired cache entries.",
                "purgedCount", purged
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Server Error", "message", e.getMessage()));
        }
    }
}
