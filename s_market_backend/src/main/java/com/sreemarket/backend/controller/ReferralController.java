package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Referrer;
import com.sreemarket.backend.repository.ReferrerRepository;
import com.sreemarket.backend.service.UserService;
import com.sreemarket.backend.model.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/referral")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ReferralController {

    @Autowired
    private ReferrerRepository referrerRepository;

    @Autowired
    private UserService userService;

    /**
     * GET /api/referral/my
     * Returns the logged-in customer's referral info (code, stats, rewards).
     * Auto-creates a referral code on first visit if one doesn't exist.
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMyReferral(HttpServletRequest request) {
        Object userIdAttr = request.getSession().getAttribute("userId");
        if (userIdAttr == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        Long userId = ((Number) userIdAttr).longValue();

        Optional<Referrer> existing = referrerRepository.findByUserId(userId);
        Referrer referrer;
        if (existing.isPresent()) {
            referrer = existing.get();
        } else {
            // Auto-create a referral code for this user
            User user = userService.getUserById(userId);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            referrer = new Referrer();
            referrer.setUserId(userId);
            referrer.setName(user.getFullName() != null ? user.getFullName() : "Customer");
            referrer.setEmail(user.getEmail() != null ? user.getEmail() : "");
            referrer.setRefs(0);
            referrer.setEarned(0.0);
            referrer.setRedeemed(0.0);
            referrer.setPending(0.0);
            referrer.setTier("bronze");
            referrer.setActive(true);

            // Generate unique referral code from user name + random suffix
            String base = (user.getFullName() != null ? user.getFullName().replaceAll("[^a-zA-Z]", "").toUpperCase() : "USER");
            base = base.length() > 6 ? base.substring(0, 6) : base;
            String code = base + (int) (1000 + Math.random() * 9000);
            // Ensure uniqueness
            while (referrerRepository.findByCode(code).isPresent()) {
                code = base + (int) (1000 + Math.random() * 9000);
            }
            referrer.setCode(code);

            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
            referrer.setJoined(sdf.format(new java.util.Date()));

            referrer = referrerRepository.save(referrer);
        }

        // Determine tier based on referral count
        String tier = calculateTier(referrer.getRefs() != null ? referrer.getRefs() : 0);
        referrer.setTier(tier);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", referrer.getId());
        result.put("userId", referrer.getUserId());
        result.put("name", referrer.getName());
        result.put("email", referrer.getEmail());
        result.put("code", referrer.getCode());
        result.put("referrals", referrer.getRefs() != null ? referrer.getRefs() : 0);
        result.put("earned", referrer.getEarned() != null ? referrer.getEarned() : 0.0);
        result.put("redeemed", referrer.getRedeemed() != null ? referrer.getRedeemed() : 0.0);
        result.put("pending", referrer.getPending() != null ? referrer.getPending() : 0.0);
        result.put("tier", tier);
        result.put("active", referrer.getActive() != null ? referrer.getActive() : true);
        result.put("joined", referrer.getJoined());

        // Next tier progress
        Map<String, Object> nextTier = getNextTierInfo(tier, referrer.getRefs() != null ? referrer.getRefs() : 0);
        result.put("nextTier", nextTier);

        // Tier milestones
        result.put("tierMilestones", getTierMilestones());

        // Referral reward config
        Map<String, Object> rewards = new LinkedHashMap<>();
        rewards.put("referrerReward", 200);
        rewards.put("refereeReward", 150);
        rewards.put("minOrderForReward", 500);
        result.put("rewards", rewards);

        // Stats
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("conversionRate", 3.2);
        stats.put("totalRewardsValue", referrer.getEarned() != null ? referrer.getEarned() : 0.0);
        stats.put("availableBalance", (referrer.getEarned() != null ? referrer.getEarned() : 0.0)
                - (referrer.getRedeemed() != null ? referrer.getRedeemed() : 0.0));
        result.put("stats", stats);

        return ResponseEntity.ok(result);
    }

    private String calculateTier(int refs) {
        if (refs >= 20) return "super";
        if (refs >= 10) return "gold";
        if (refs >= 5) return "silver";
        return "bronze";
    }

    private Map<String, Object> getNextTierInfo(String currentTier, int currentRefs) {
        Map<String, Object> info = new LinkedHashMap<>();
        int nextThreshold;
        String nextName;

        switch (currentTier) {
            case "bronze":
                nextThreshold = 5;
                nextName = "Silver";
                break;
            case "silver":
                nextThreshold = 10;
                nextName = "Gold";
                break;
            case "gold":
                nextThreshold = 20;
                nextName = "Super";
                break;
            default: // super — max tier
                info.put("currentTier", "Super");
                info.put("isMaxTier", true);
                info.put("progress", 100);
                info.put("remaining", 0);
                return info;
        }

        info.put("currentTier", currentTier.substring(0, 1).toUpperCase() + currentTier.substring(1));
        info.put("nextTier", nextName);
        info.put("current", currentRefs);
        info.put("required", nextThreshold);
        int progress = nextThreshold > 0 ? (int) ((currentRefs * 100.0) / nextThreshold) : 0;
        info.put("progress", Math.min(progress, 100));
        info.put("remaining", Math.max(0, nextThreshold - currentRefs));
        info.put("isMaxTier", false);
        return info;
    }

    private java.util.List<Map<String, Object>> getTierMilestones() {
        java.util.List<Map<String, Object>> tiers = new java.util.ArrayList<>();

        String[][] config = {
            {"bronze", "Bronze", "cd7f32", "1", "4", "200"},
            {"silver", "Silver", "64748b", "5", "9", "300"},
            {"gold", "Gold", "d97706", "10", "19", "500"},
            {"super", "Super", "E03E1A", "20", "∞", "800"},
        };

        for (String[] t : config) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", t[0]);
            entry.put("name", t[1]);
            entry.put("color", t[2]);
            entry.put("min", t[3]);
            entry.put("max", t[4]);
            entry.put("bonus", Integer.parseInt(t[5]));
            java.util.List<String> perks = new java.util.ArrayList<>();
            if (t[0].equals("bronze")) {
                perks.add("₹200 per referral");
                perks.add("Standard support");
            } else if (t[0].equals("silver")) {
                perks.add("₹300 per referral");
                perks.add("Priority support");
                perks.add("+50 loyalty pts");
            } else if (t[0].equals("gold")) {
                perks.add("₹500 per referral");
                perks.add("Dedicated support");
                perks.add("+100 loyalty pts");
                perks.add("Exclusive badge");
            } else if (t[0].equals("super")) {
                perks.add("₹800 per referral");
                perks.add("VIP support");
                perks.add("+200 loyalty pts");
                perks.add("Free delivery");
                perks.add("Early access");
            }
            entry.put("perks", perks);
            tiers.add(entry);
        }
        return tiers;
    }
}
