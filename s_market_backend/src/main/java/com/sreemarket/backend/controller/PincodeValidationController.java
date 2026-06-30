package com.sreemarket.backend.controller;

import com.sreemarket.backend.dto.PincodeValidationResponse;
import com.sreemarket.backend.service.PincodeValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Shipping Availability Validation — Pincode Serviceability API
 *
 * Endpoints:
 * - POST /api/shipping/validate          Single vendor → customer pincode check
 * - POST /api/shipping/validate/cart     Multi-vendor cart-wide check
 * - POST /api/shipping/quick-check       Quick pincode-only check
 * - POST /api/shipping/validate-bulk     Bulk validation for multiple pincodes
 */
@RestController
@RequestMapping("/api/shipping")
public class PincodeValidationController {

    @Autowired
    private PincodeValidationService pincodeValidationService;

    /**
     * POST /api/shipping/validate
     *
     * Validate shipping availability from a single vendor to a customer pincode.
     *
     * Request body:
     * {
     *   "vendorId": 123,
     *   "pincode": "110001"
     * }
     *
     * Response: PincodeValidationResponse with courier options, EDD, charges.
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateShipping(@RequestBody Map<String, Object> request) {
        try {
            Long vendorId = request.get("vendorId") != null
                ? ((Number) request.get("vendorId")).longValue() : null;
            String pincode = (String) request.get("pincode");

            if (vendorId == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Validation Error", "message", "vendorId is required."));
            }
            if (pincode == null || pincode.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Validation Error", "message", "pincode is required."));
            }

            PincodeValidationResponse response =
                pincodeValidationService.validateSingleVendor(vendorId, pincode.trim());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Server Error",
                    "message", "Failed to validate shipping: " + e.getMessage()));
        }
    }

    /**
     * POST /api/shipping/validate/cart
     *
     * Validate shipping for a multi-vendor cart.
     * Each vendor's products are checked independently.
     *
     * Request body:
     * {
     *   "productIds": [1, 2, 3, 4],
     *   "pincode": "110001"
     * }
     *
     * Response: Aggregate response with per-vendor breakdown.
     */
    @PostMapping("/validate/cart")
    public ResponseEntity<?> validateCartShipping(@RequestBody Map<String, Object> request) {
        try {
            String pincode = (String) request.get("pincode");

            if (pincode == null || pincode.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Validation Error", "message", "pincode is required."));
            }

            @SuppressWarnings("unchecked")
            List<Number> productIdsRaw = (List<Number>) request.get("productIds");
            if (productIdsRaw == null || productIdsRaw.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Validation Error", "message",
                        "productIds is required and must be a non-empty array."));
            }

            List<Long> productIds = productIdsRaw.stream()
                .map(Number::longValue)
                .collect(java.util.stream.Collectors.toList());

            PincodeValidationResponse response =
                pincodeValidationService.validateCart(productIds, pincode.trim());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Server Error",
                    "message", "Failed to validate cart shipping: " + e.getMessage()));
        }
    }

    /**
     * POST /api/shipping/quick-check
     *
     * Quick pincode validation — just checks if ANY courier services this pincode.
     * Used during address entry on checkout to give immediate feedback.
     *
     * Request body:
     * {
     *   "pincode": "110001"
     * }
     *
     * Response: Simple serviceable=true/false with message.
     */
    @PostMapping("/quick-check")
    public ResponseEntity<?> quickCheck(@RequestBody Map<String, String> request) {
        try {
            String pincode = request.get("pincode");
            if (pincode == null || pincode.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Validation Error", "message", "pincode is required."));
            }

            PincodeValidationResponse response =
                pincodeValidationService.quickCheck(pincode.trim());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Server Error",
                    "message", "Failed to check pincode: " + e.getMessage()));
        }
    }

    /**
     * POST /api/shipping/validate-bulk
     *
     * Validate multiple pincodes at once for a single vendor.
     * Used by vendors to pre-configure which pincodes they can ship to.
     *
     * Request body:
     * {
     *   "vendorId": 123,
     *   "pincodes": ["110001", "201301", "400001"]
     * }
     *
     * Response: Map of pincode → validation status.
     */
    @PostMapping("/validate-bulk")
    public ResponseEntity<?> validateBulk(@RequestBody Map<String, Object> request) {
        try {
            Long vendorId = request.get("vendorId") != null
                ? ((Number) request.get("vendorId")).longValue() : null;

            @SuppressWarnings("unchecked")
            List<String> pincodes = (List<String>) request.get("pincodes");

            if (vendorId == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Validation Error", "message", "vendorId is required."));
            }
            if (pincodes == null || pincodes.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Validation Error", "message", "pincodes is required."));
            }

            Map<String, PincodeValidationResponse> results = new java.util.LinkedHashMap<>();
            for (String pincode : pincodes) {
                results.put(pincode,
                    pincodeValidationService.validateSingleVendor(vendorId, pincode.trim()));
            }

            return ResponseEntity.ok(Map.of(
                "vendorId", vendorId,
                "totalChecked", pincodes.size(),
                "results", results
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Server Error",
                    "message", "Failed to validate pincodes: " + e.getMessage()));
        }
    }

}

