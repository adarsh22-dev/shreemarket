package com.sreemarket.backend.controller;

import com.sreemarket.backend.service.InventoryAlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/inventory-alerts")
@CrossOrigin(origins = "http://localhost:5173")
public class InventoryAlertController {

    @Autowired
    private InventoryAlertService service;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(service.getByStatus(status));
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<?> getByVendor(@PathVariable Long vendorId) {
        return ResponseEntity.ok(service.getByVendor(vendorId));
    }

    @GetMapping("/severity/{severity}")
    public ResponseEntity<?> getBySeverity(@PathVariable String severity) {
        return ResponseEntity.ok(service.getBySeverity(severity));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(alert -> ResponseEntity.ok((Object) alert))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<?> acknowledge(@PathVariable Long id) {
        return ResponseEntity.ok(service.acknowledge(id));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<?> resolve(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.resolve(id, body.get("notes")));
    }

    @PostMapping("/{id}/dismiss")
    public ResponseEntity<?> dismiss(@PathVariable Long id) {
        return ResponseEntity.ok(service.dismiss(id));
    }

    @PutMapping("/{id}/notes")
    public ResponseEntity<?> updateNotes(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateNotes(id, body.get("notes")));
    }

    @PostMapping("/scan")
    public ResponseEntity<?> scanAll() {
        return ResponseEntity.ok(service.scanAllProducts());
    }

    @GetMapping("/low-stock-products")
    public ResponseEntity<?> getLowStockProducts() {
        return ResponseEntity.ok(service.getLowStockProducts());
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    @GetMapping("/thresholds")
    public ResponseEntity<?> getThresholds() {
        return ResponseEntity.ok(service.getThresholds());
    }

    @PutMapping("/thresholds")
    public ResponseEntity<?> updateThresholds(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateThresholds(body));
    }
}
