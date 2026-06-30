package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.AbandonedCart;
import com.sreemarket.backend.service.AbandonedCartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AbandonedCartController {

    @Autowired
    private AbandonedCartService service;

    // ── Admin Endpoints ──

    @GetMapping("/admin/abandoned-carts")
    public ResponseEntity<List<AbandonedCart>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/admin/abandoned-carts/status/{status}")
    public ResponseEntity<List<AbandonedCart>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(service.getByStatus(status));
    }

    @GetMapping("/admin/abandoned-carts/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    @GetMapping("/admin/abandoned-carts/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin/abandoned-carts/{id}/send-recovery")
    public ResponseEntity<?> sendRecoveryEmail(@PathVariable Long id) {
        try {
            AbandonedCart updated = service.sendRecoveryEmail(id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin/abandoned-carts/send-bulk")
    public ResponseEntity<?> sendBulkRecovery() {
        try {
            Map<String, Object> result = service.sendBulkRecoveryEmails();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin/abandoned-carts/{id}/dismiss")
    public ResponseEntity<?> dismiss(@PathVariable Long id) {
        try {
            AbandonedCart updated = service.dismiss(id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin/abandoned-carts/{cartId}/recovered")
    public ResponseEntity<?> markRecovered(@PathVariable Long cartId) {
        try {
            service.markRecovered(cartId);
            return ResponseEntity.ok(Map.of("message", "Cart marked as recovered"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin/abandoned-carts/scan")
    public ResponseEntity<?> scanNow() {
        try {
            service.detectAbandonedCarts();
            return ResponseEntity.ok(Map.of("message", "Abandoned cart scan completed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/admin/abandoned-carts/settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        return ResponseEntity.ok(service.getStats());
    }
}
