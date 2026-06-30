package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.PriceDropAlert;
import com.sreemarket.backend.service.PriceDropAlertService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/price-drop-alerts")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class PriceDropAlertController {

    private final PriceDropAlertService service;

    public PriceDropAlertController(PriceDropAlertService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<PriceDropAlert>> getUserAlerts(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(service.getUserAlerts(userId));
    }

    @PostMapping
    public ResponseEntity<PriceDropAlert> createAlert(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        Long productId = Long.valueOf(body.get("productId").toString());
        Double targetPrice = Double.valueOf(body.get("targetPrice").toString());
        String email = (String) body.get("email");
        PriceDropAlert alert = service.createAlert(userId, productId, targetPrice, email);
        if (alert == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(alert);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelAlert(HttpServletRequest request, @PathVariable Long id) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        service.cancelAlert(id, userId);
        return ResponseEntity.ok().build();
    }
}
