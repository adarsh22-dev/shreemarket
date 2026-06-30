package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.CustomerSegment;
import com.sreemarket.backend.service.CustomerSegmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CustomerSegmentController {

    @Autowired
    private CustomerSegmentService service;

    // ── Admin Endpoints ──

    @GetMapping("/admin/customer-segments")
    public ResponseEntity<List<CustomerSegment>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/admin/customer-segments/active")
    public ResponseEntity<List<CustomerSegment>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/admin/customer-segments/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(service.getSegmentStats());
    }

    @GetMapping("/admin/customer-segments/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/admin/customer-segments/{id}/customers")
    public ResponseEntity<?> getCustomersInSegment(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getCustomersInSegment(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin/customer-segments")
    public ResponseEntity<?> create(@RequestBody CustomerSegment segment) {
        try {
            return ResponseEntity.ok(service.create(segment));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/customer-segments/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody CustomerSegment segment) {
        try {
            return ResponseEntity.ok(service.update(id, segment));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/admin/customer-segments/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.toggleStatus(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin/customer-segments/recalculate")
    public ResponseEntity<?> recalculateAll() {
        try {
            service.recalculateAllCounts();
            return ResponseEntity.ok(Map.of("message", "All segment counts recalculated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/customer-segments/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Segment deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
