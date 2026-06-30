package com.sreemarket.backend.controller;

import com.sreemarket.backend.service.VendorFollowService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/vendor-follows")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class VendorFollowController {

    @Autowired
    private VendorFollowService vendorFollowService;

    @PostMapping("/follow/{vendorId}")
    public ResponseEntity<?> follow(@PathVariable Long vendorId, HttpServletRequest request) {
        try {
            Long userId = AuthUtil.getAuthenticatedUserId(request);
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            return ResponseEntity.ok(vendorFollowService.follow(userId, vendorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/unfollow/{vendorId}")
    public ResponseEntity<?> unfollow(@PathVariable Long vendorId, HttpServletRequest request) {
        try {
            Long userId = AuthUtil.getAuthenticatedUserId(request);
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            vendorFollowService.unfollow(userId, vendorId);
            return ResponseEntity.ok(Map.of("message", "Unfollowed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-follows")
    public ResponseEntity<?> getMyFollows(HttpServletRequest request) {
        try {
            Long userId = AuthUtil.getAuthenticatedUserId(request);
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            return ResponseEntity.ok(vendorFollowService.getFollowedVendors(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/check/{vendorId}")
    public ResponseEntity<?> isFollowing(@PathVariable Long vendorId, HttpServletRequest request) {
        try {
            Long userId = AuthUtil.getAuthenticatedUserId(request);
            if (userId == null) return ResponseEntity.ok(Map.of("following", false));
            return ResponseEntity.ok(Map.of("following", vendorFollowService.isFollowing(userId, vendorId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/count/{vendorId}")
    public ResponseEntity<?> getFollowerCount(@PathVariable Long vendorId) {
        try {
            return ResponseEntity.ok(Map.of("count", vendorFollowService.getFollowerCount(vendorId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats/{vendorId}")
    public ResponseEntity<?> getVendorStats(@PathVariable Long vendorId) {
        try {
            return ResponseEntity.ok(vendorFollowService.getVendorFollowStats(vendorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
