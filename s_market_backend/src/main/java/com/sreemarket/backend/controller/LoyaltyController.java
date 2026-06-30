package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.LoyaltyCustomer;
import com.sreemarket.backend.model.LoyaltyTransaction;
import com.sreemarket.backend.repository.LoyaltyCustomerRepository;
import com.sreemarket.backend.repository.LoyaltyTransactionRepository;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/loyalty")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class LoyaltyController {

    @Autowired
    private LoyaltyCustomerRepository loyaltyCustomerRepository;

    @Autowired
    private LoyaltyTransactionRepository loyaltyTransactionRepository;

    /** Tier definitions for customer-facing view */
    private static final Map<String, Map<String, Object>> TIERS = Map.of(
        "bronze",   Map.of("min", 0, "max", 999, "color", "#f97316", "perks", List.of("5% cashback", "Birthday bonus")),
        "silver",   Map.of("min", 1000, "max", 4999, "color", "#64748b", "perks", List.of("8% cashback", "Free shipping", "Birthday bonus")),
        "gold",     Map.of("min", 5000, "max", 19999, "color", "#d97706", "perks", List.of("12% cashback", "Priority support", "Free shipping", "Early access")),
        "platinum", Map.of("min", 20000, "max", Integer.MAX_VALUE, "color", "#6d28d9", "perks", List.of("18% cashback", "Dedicated manager", "Free express", "VIP events", "Early access"))
    );

    /** Derive tier from points */
    private String deriveTier(int points) {
        if (points >= 20000) return "platinum";
        if (points >= 5000)  return "gold";
        if (points >= 1000)  return "silver";
        return "bronze";
    }

    /**
     * GET /api/loyalty/me - Get loyalty info for the logged-in user.
     * Creates a loyalty record if one doesn't exist.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyLoyalty(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        // Look up or create loyalty record
        LoyaltyCustomer loyalty = loyaltyCustomerRepository.findByUserId(userId).orElse(null);
        if (loyalty == null) {
            // Try to find by email from user session
            loyalty = new LoyaltyCustomer();
            loyalty.setUserId(userId);
            loyalty.setPoints(0);
            loyalty.setEarned(0);
            loyalty.setRedeemed(0);
            loyalty.setTier("bronze");
            loyalty.setName("Customer");
            loyalty.setEmail("");
            loyalty.setLastActivity(new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date()));
            loyalty = loyaltyCustomerRepository.save(loyalty);
        }

        // Calculate tier progress
        Map<String, Object> tierInfo = (Map<String, Object>) TIERS.get(loyalty.getTier());
        int currentTierMin = tierInfo != null ? (int) tierInfo.get("min") : 0;
        int currentTierMax = tierInfo != null ? (int) tierInfo.get("max") : 999;
        int progressToNext = loyalty.getTier().equals("platinum") ? 100
            : (currentTierMax > currentTierMin)
                ? Math.min(100, (int) (((double) (loyalty.getPoints() - currentTierMin) / (currentTierMax - currentTierMin)) * 100))
                : 0;

        // Next tier name
        String nextTier = null;
        if (loyalty.getTier().equals("bronze")) nextTier = "silver";
        else if (loyalty.getTier().equals("silver")) nextTier = "gold";
        else if (loyalty.getTier().equals("gold")) nextTier = "platinum";

        Map<String, Object> response = new HashMap<>();
        response.put("id", loyalty.getId());
        response.put("points", loyalty.getPoints());
        response.put("earned", loyalty.getEarned());
        response.put("redeemed", loyalty.getRedeemed());
        response.put("tier", loyalty.getTier());
        response.put("tierProgress", progressToNext);
        response.put("nextTier", nextTier);
        response.put("perks", tierInfo != null ? tierInfo.get("perks") : List.of());
        response.put("lastActivity", loyalty.getLastActivity());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/loyalty/transactions - Get recent points history.
     */
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        List<LoyaltyTransaction> transactions = loyaltyTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (LoyaltyTransaction t : transactions) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", t.getId());
            item.put("type", t.getType());
            item.put("points", t.getPoints());
            item.put("reason", t.getReason());
            item.put("reference", t.getReference());
            item.put("createdAt", t.getCreatedAt());
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/loyalty/calculate-discount - Calculate discount for a given points amount.
     * Body: { "points": 500 }
     * Returns: { "discountAmount": 100, "remainingPoints": ... }
     * Rate: 5 points = 1 rupee
     */
    @PostMapping("/calculate-discount")
    public ResponseEntity<?> calculateDiscount(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        int pointsToRedeem = body.get("points") instanceof Number ? ((Number) body.get("points")).intValue() : 0;
        if (pointsToRedeem <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid points amount"));
        }

        LoyaltyCustomer loyalty = loyaltyCustomerRepository.findByUserId(userId).orElse(null);
        if (loyalty == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No loyalty account found"));
        }

        if (pointsToRedeem > loyalty.getPoints()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Insufficient points"));
        }

        // 5 points = 1 rupee discount
        double discountAmount = pointsToRedeem / 5.0;
        int remainingPoints = loyalty.getPoints() - pointsToRedeem;

        Map<String, Object> response = new HashMap<>();
        response.put("discountAmount", Math.round(discountAmount * 100.0) / 100.0);
        response.put("pointsUsed", pointsToRedeem);
        response.put("remainingPoints", remainingPoints);
        response.put("rate", "5 points = ₹1");

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/loyalty/redeem - Redeem points.
     * Body: { "points": 500, "orderNumber": "ORD-123" }
     */
    @PostMapping("/redeem")
    public ResponseEntity<?> redeemPoints(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        int pointsToRedeem = body.get("points") instanceof Number ? ((Number) body.get("points")).intValue() : 0;
        String orderNumber = (String) body.getOrDefault("orderNumber", "");

        if (pointsToRedeem <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid points amount"));
        }

        LoyaltyCustomer loyalty = loyaltyCustomerRepository.findByUserId(userId).orElse(null);
        if (loyalty == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No loyalty account found"));
        }

        if (pointsToRedeem > loyalty.getPoints()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Insufficient points"));
        }

        double discountAmount = pointsToRedeem / 5.0;

        // Update loyalty record
        loyalty.setPoints(loyalty.getPoints() - pointsToRedeem);
        loyalty.setRedeemed(loyalty.getRedeemed() + pointsToRedeem);
        loyalty.setLastActivity(new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date()));
        loyaltyCustomerRepository.save(loyalty);

        // Record transaction
        LoyaltyTransaction tx = new LoyaltyTransaction();
        tx.setUserId(userId);
        tx.setType("REDEEMED");
        tx.setPoints(pointsToRedeem);
        tx.setReason("Order discount");
        tx.setReference(orderNumber);
        loyaltyTransactionRepository.save(tx);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("discountAmount", Math.round(discountAmount * 100.0) / 100.0);
        response.put("pointsUsed", pointsToRedeem);
        response.put("remainingPoints", loyalty.getPoints());
        response.put("message", "Points redeemed successfully! You saved ₹" + String.format("%.2f", discountAmount));

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/loyalty/earn - Earn points (typically called from OrderService).
     * Also exposed as an API for future use (e.g., review bonuses).
     * Body: { "points": 100, "reason": "Purchase reward", "reference": "ORD-123" }
     */
    @PostMapping("/earn")
    public ResponseEntity<?> earnPoints(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        int points = body.get("points") instanceof Number ? ((Number) body.get("points")).intValue() : 0;
        String reason = (String) body.getOrDefault("reason", "Reward");
        String reference = (String) body.getOrDefault("reference", "");

        if (points <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid points amount"));
        }

        LoyaltyCustomer loyalty = loyaltyCustomerRepository.findByUserId(userId).orElse(null);
        if (loyalty == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No loyalty account found"));
        }

        // Update loyalty record
        loyalty.setPoints(loyalty.getPoints() + points);
        loyalty.setEarned(loyalty.getEarned() + points);
        loyalty.setTier(deriveTier(loyalty.getPoints()));
        loyalty.setLastActivity(new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date()));
        loyaltyCustomerRepository.save(loyalty);

        // Record transaction
        LoyaltyTransaction tx = new LoyaltyTransaction();
        tx.setUserId(userId);
        tx.setType("EARNED");
        tx.setPoints(points);
        tx.setReason(reason);
        tx.setReference(reference);
        loyaltyTransactionRepository.save(tx);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("points", points);
        response.put("totalPoints", loyalty.getPoints());
        response.put("tier", loyalty.getTier());
        response.put("message", "You earned " + points + " points!");

        return ResponseEntity.ok(response);
    }
}
