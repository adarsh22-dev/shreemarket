package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.GiftCard;
import com.sreemarket.backend.service.GiftCardService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gift-cards")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class GiftCardController {

    private final GiftCardService service;

    public GiftCardController(GiftCardService service) {
        this.service = service;
    }

    @GetMapping("/admin")
    public ResponseEntity<List<GiftCard>> getAllGiftCards(HttpServletRequest request) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(service.getAllGiftCards());
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<GiftCard>> getVendorGiftCards(@PathVariable Long vendorId) {
        return ResponseEntity.ok(service.getVendorGiftCards(vendorId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<GiftCard>> getMyGiftCards(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(service.getAllGiftCards()); // Simplified: return all for now
    }

    @GetMapping("/{id}")
    public ResponseEntity<GiftCard> getGiftCard(@PathVariable Long id) {
        GiftCard card = service.getGiftCard(id);
        if (card == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(card);
    }

    @PostMapping
    public ResponseEntity<GiftCard> createGiftCard(HttpServletRequest request, @RequestBody GiftCard giftCard) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        giftCard.setSenderUserId(userId);
        return ResponseEntity.ok(service.createGiftCard(giftCard));
    }

    @PostMapping("/redeem")
    public ResponseEntity<GiftCard> redeemGiftCard(@RequestBody Map<String, Object> body) {
        String code = (String) body.get("code");
        Double amount = Double.valueOf(body.get("amount").toString());
        GiftCard card = service.redeemGiftCard(code, amount);
        if (card == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(card);
    }
}
