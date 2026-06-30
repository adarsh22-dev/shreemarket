package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Wishlist;
import com.sreemarket.backend.service.WishlistService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    private ResponseEntity<?> checkOwnership(Long userId, HttpServletRequest request) {
        if (!AuthUtil.isOwnerOrAdmin(userId, request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        return null;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getWishlist(@PathVariable Long userId, HttpServletRequest request) {
        ResponseEntity<?> err = checkOwnership(userId, request);
        if (err != null) return err;
        return ResponseEntity.ok(wishlistService.getWishlist(userId));
    }

    @PostMapping("/{userId}/add/{productId}")
    public ResponseEntity<?> addToWishlist(@PathVariable Long userId, @PathVariable Long productId, HttpServletRequest request) {
        ResponseEntity<?> err = checkOwnership(userId, request);
        if (err != null) return err;
        try {
            Wishlist wishlist = wishlistService.addToWishlist(userId, productId);
            return ResponseEntity.ok(wishlist);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}/remove/{productId}")
    public ResponseEntity<?> removeFromWishlist(@PathVariable Long userId, @PathVariable Long productId, HttpServletRequest request) {
        ResponseEntity<?> err = checkOwnership(userId, request);
        if (err != null) return err;
        try {
            wishlistService.removeFromWishlist(userId, productId);
            return ResponseEntity.ok(Map.of("message", "Removed from wishlist"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{userId}/check/{productId}")
    public ResponseEntity<?> checkWishlist(@PathVariable Long userId, @PathVariable Long productId, HttpServletRequest request) {
        ResponseEntity<?> err = checkOwnership(userId, request);
        if (err != null) return err;
        return ResponseEntity.ok(wishlistService.isInWishlist(userId, productId));
    }
}
