package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.GSTInvoice;
import com.sreemarket.backend.service.GSTInvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/gst-invoices")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class GSTInvoiceController {

    @Autowired
    private GSTInvoiceService service;

    @GetMapping
    public ResponseEntity<List<GSTInvoice>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<GSTInvoice>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(service.getByStatus(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<GSTInvoice> create(@RequestBody GSTInvoice invoice) {
        return ResponseEntity.ok(service.create(invoice));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody GSTInvoice invoice) {
        try {
            return ResponseEntity.ok(service.update(id, invoice));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            if (status == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            return ResponseEntity.ok(service.updateStatus(id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Invoice deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
