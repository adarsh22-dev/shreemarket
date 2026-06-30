package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Currency;
import com.sreemarket.backend.service.CurrencyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CurrencyController {

    @Autowired
    private CurrencyService service;

    // ── Public Endpoints ──

    @GetMapping("/currencies/public")
    public ResponseEntity<List<Currency>> getPublicActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/currencies/public/default")
    public ResponseEntity<Currency> getDefaultCurrency() {
        return ResponseEntity.ok(service.getDefault());
    }

    @PostMapping("/currencies/convert")
    public ResponseEntity<?> convert(@RequestBody Map<String, Object> body) {
        try {
            double amount = ((Number) body.get("amount")).doubleValue();
            String fromCode = (String) body.get("from");
            String toCode = (String) body.get("to");
            double result = service.convert(amount, fromCode, toCode);
            return ResponseEntity.ok(Map.of("amount", result, "from", fromCode, "to", toCode));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Admin Endpoints ──

    @GetMapping("/admin/currencies")
    public ResponseEntity<List<Currency>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/admin/currencies/active")
    public ResponseEntity<List<Currency>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/admin/currencies/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin/currencies")
    public ResponseEntity<?> create(@RequestBody Currency currency) {
        try {
            return ResponseEntity.ok(service.create(currency));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/currencies/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Currency currency) {
        try {
            return ResponseEntity.ok(service.update(id, currency));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/admin/currencies/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.toggleStatus(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/currencies/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Currency deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
