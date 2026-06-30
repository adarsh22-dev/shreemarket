package com.sreemarket.backend.controller;

import com.sreemarket.backend.dto.CartItemRequest;
import com.sreemarket.backend.model.Cart;
import com.sreemarket.backend.service.CartService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CartController {

    @Autowired
    private CartService cartService;

    private ResponseEntity<?> checkOwnership(Long userId, HttpServletRequest request) {
        if (!AuthUtil.isOwnerOrAdmin(userId, request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        return null;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getCart(@PathVariable Long userId, HttpServletRequest request) {
        ResponseEntity<?> err = checkOwnership(userId, request);
        if (err != null) return err;
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    @PostMapping("/{userId}/add")
    public ResponseEntity<?> addToCart(@PathVariable Long userId, @RequestBody CartItemRequest request, HttpServletRequest httpRequest) {
        ResponseEntity<?> err = checkOwnership(userId, httpRequest);
        if (err != null) return err;
        try {
            Cart cart = cartService.addItem(userId, request);
            return ResponseEntity.ok(cart);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{userId}/update/{itemId}")
    public ResponseEntity<?> updateQuantity(@PathVariable Long userId, @PathVariable Long itemId,
            @RequestBody Map<String, Integer> payload, HttpServletRequest request) {
        ResponseEntity<?> err = checkOwnership(userId, request);
        if (err != null) return err;
        try {
            Integer quantity = payload.get("quantity");
            if (quantity == null || quantity < 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Valid quantity is required"));
            }
            Cart cart = cartService.updateItemQuantity(userId, itemId, quantity);
            return ResponseEntity.ok(cart);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}/remove/{itemId}")
    public ResponseEntity<?> removeItem(@PathVariable Long userId, @PathVariable Long itemId, HttpServletRequest request) {
        ResponseEntity<?> err = checkOwnership(userId, request);
        if (err != null) return err;
        try {
            Cart cart = cartService.removeItem(userId, itemId);
            return ResponseEntity.ok(cart);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}/clear")
    public ResponseEntity<?> clearCart(@PathVariable Long userId, HttpServletRequest request) {
        ResponseEntity<?> err = checkOwnership(userId, request);
        if (err != null) return err;
        try {
            cartService.clearCart(userId);
            return ResponseEntity.ok(Map.of("message", "Cart cleared successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{userId}/merge")
    public ResponseEntity<?> mergeCart(@PathVariable Long userId, @RequestBody List<CartItemRequest> items, HttpServletRequest request) {
        ResponseEntity<?> err = checkOwnership(userId, request);
        if (err != null) return err;
        try {
            Cart cart = cartService.mergeGuestCart(userId, items);
            return ResponseEntity.ok(cart);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{userId}/save/{itemId}")
    public ResponseEntity<?> moveToSaved(@PathVariable Long userId, @PathVariable Long itemId, HttpServletRequest request) {
        ResponseEntity<?> err = checkOwnership(userId, request);
        if (err != null) return err;
        try {
            Cart cart = cartService.moveToSaved(userId, itemId);
            return ResponseEntity.ok(cart);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{userId}/move-to-cart/{itemId}")
    public ResponseEntity<?> moveToCartFromSaved(@PathVariable Long userId, @PathVariable Long itemId, HttpServletRequest request) {
        ResponseEntity<?> err = checkOwnership(userId, request);
        if (err != null) return err;
        try {
            Cart cart = cartService.moveToCartFromSaved(userId, itemId);
            return ResponseEntity.ok(cart);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
