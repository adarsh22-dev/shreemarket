package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.RecentlyViewed;
import com.sreemarket.backend.service.RecentlyViewedService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recently-viewed")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class RecentlyViewedController {

    private final RecentlyViewedService service;

    public RecentlyViewedController(RecentlyViewedService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<RecentlyViewed>> getRecentlyViewed(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(service.getRecentlyViewed(userId));
    }

    @PostMapping
    public ResponseEntity<RecentlyViewed> trackView(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        Long productId = Long.valueOf(body.get("productId").toString());
        String productName = (String) body.get("productName");
        String productImage = (String) body.get("productImage");
        Double productPrice = body.get("productPrice") != null ? Double.valueOf(body.get("productPrice").toString()) : 0;
        return ResponseEntity.ok(service.trackView(userId, productId, productName, productImage, productPrice));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearHistory(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        service.clearHistory(userId);
        return ResponseEntity.ok().build();
    }
}
