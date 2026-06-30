package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.BackInStockAlert;
import com.sreemarket.backend.service.BackInStockAlertService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/back-in-stock")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class BackInStockAlertController {

    private final BackInStockAlertService service;

    public BackInStockAlertController(BackInStockAlertService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<BackInStockAlert>> getUserAlerts(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(service.getUserAlerts(userId));
    }

    @PostMapping
    public ResponseEntity<BackInStockAlert> createAlert(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        Long productId = Long.valueOf(body.get("productId").toString());
        String email = (String) body.get("email");
        BackInStockAlert alert = service.createAlert(userId, productId, email);
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
