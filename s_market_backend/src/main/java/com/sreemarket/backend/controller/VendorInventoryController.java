package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.StockMovement;
import com.sreemarket.backend.util.AuthUtil;
import com.sreemarket.backend.service.StockMovementService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor/inventory-history")
public class VendorInventoryController {

    @Autowired
    private StockMovementService stockMovementService;

    /**
     * GET /api/vendor/inventory-history
     * Get paginated stock movements for the authenticated vendor.
     */
    @GetMapping
    public ResponseEntity<?> getMovements(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        try {
            Long vendorId = AuthUtil.getAuthenticatedUserId(request);
            if (vendorId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            LocalDate start = (startDate != null && !startDate.isEmpty())
                ? LocalDate.parse(startDate, DateTimeFormatter.ISO_DATE)
                : null;
            LocalDate end = (endDate != null && !endDate.isEmpty())
                ? LocalDate.parse(endDate, DateTimeFormatter.ISO_DATE)
                : null;

            Page<StockMovement> movements = stockMovementService.getVendorMovements(
                vendorId, productId, type, search, start, end, page, size);

            return ResponseEntity.ok(movements);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/vendor/inventory-history/stats
     * Get summary statistics for the vendor's inventory movements.
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(HttpServletRequest request) {
        try {
            Long vendorId = AuthUtil.getAuthenticatedUserId(request);
            if (vendorId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            return ResponseEntity.ok(stockMovementService.getVendorStats(vendorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/vendor/inventory-history/products/{productId}
     * Get stock movement history for a specific product.
     */
    @GetMapping("/products/{productId}")
    public ResponseEntity<?> getProductMovements(@PathVariable Long productId, HttpServletRequest request) {
        try {
            Long vendorId = AuthUtil.getAuthenticatedUserId(request);
            if (vendorId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            return ResponseEntity.ok(
                stockMovementService.getVendorMovements(vendorId, productId, null, null, null, null, 0, 100));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
