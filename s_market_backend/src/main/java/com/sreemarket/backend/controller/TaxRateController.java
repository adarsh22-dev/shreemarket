package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.TaxRate;
import com.sreemarket.backend.service.TaxRateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class TaxRateController {

    @Autowired
    private TaxRateService service;

    @GetMapping("/tax-rates/public")
    public ResponseEntity<List<TaxRate>> getPublicActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/admin/tax-rates")
    public ResponseEntity<List<TaxRate>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/admin/tax-rates/active")
    public ResponseEntity<List<TaxRate>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/admin/tax-rates/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin/tax-rates")
    public ResponseEntity<TaxRate> create(@RequestBody TaxRate taxRate) {
        return ResponseEntity.ok(service.create(taxRate));
    }

    @PutMapping("/admin/tax-rates/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody TaxRate taxRate) {
        try {
            return ResponseEntity.ok(service.update(id, taxRate));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/admin/tax-rates/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.toggleStatus(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/tax-rates/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Tax rate deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
