package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Coupon;
import com.sreemarket.backend.repository.CouponRepository;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor/coupons")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorCouponController {

    @Autowired
    private CouponRepository couponRepository;

    private Long getVendorId(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return null;
        return userId;
    }

    @GetMapping
    public ResponseEntity<?> getVendorCoupons(HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        List<Coupon> coupons = couponRepository.findByVendorId(vendorId);
        return ResponseEntity.ok(coupons);
    }

    @PostMapping
    public ResponseEntity<?> createCoupon(@RequestBody Coupon coupon, HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        coupon.setVendorId(vendorId);
        // Check for duplicate coupon code
        if (couponRepository.findByVendorId(vendorId).stream()
                .anyMatch(c -> c.getCode() != null && c.getCode().equalsIgnoreCase(coupon.getCode()))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Coupon code already exists"));
        }
        // Default values for new coupons
        if (coupon.getUses() == null) coupon.setUses(0);
        if (coupon.getRevenue() == null) coupon.setRevenue(0.0);
        if (coupon.getOrders() == null) coupon.setOrders(0);
        if (coupon.getStatus() == null) coupon.setStatus("active");
        Coupon saved = couponRepository.save(coupon);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCoupon(@PathVariable Long id, @RequestBody Coupon updated,
                                           HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Coupon existing = couponRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Coupon not found"));
        }
        if (!vendorId.equals(existing.getVendorId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied — coupon does not belong to you"));
        }
        // Update allowed fields
        existing.setCode(updated.getCode());
        existing.setType(updated.getType());
        existing.setValue(updated.getValue());
        existing.setMinOrder(updated.getMinOrder());
        existing.setMaxDisc(updated.getMaxDisc());
        existing.setMaxUses(updated.getMaxUses());
        existing.setExpiry(updated.getExpiry());
        existing.setCategories(updated.getCategories());
        existing.setStatus(updated.getStatus());
        Coupon saved = couponRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCoupon(@PathVariable Long id, HttpServletRequest request) {
        Long vendorId = getVendorId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Coupon existing = couponRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Coupon not found"));
        }
        if (!vendorId.equals(existing.getVendorId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied — coupon does not belong to you"));
        }
        couponRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Coupon deleted"));
    }
}
