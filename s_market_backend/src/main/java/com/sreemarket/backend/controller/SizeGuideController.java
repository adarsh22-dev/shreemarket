package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.SizeGuide;
import com.sreemarket.backend.service.SizeGuideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class SizeGuideController {

    @Autowired
    private SizeGuideService sizeGuideService;

    // Public endpoints
    @GetMapping("/size-guides/active")
    public ResponseEntity<?> getActive() {
        try {
            return ResponseEntity.ok(sizeGuideService.getActive());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/size-guides/category/{category}")
    public ResponseEntity<?> getByCategory(@PathVariable String category) {
        try {
            return ResponseEntity.ok(sizeGuideService.searchByCategory(category));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/size-guides/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(sizeGuideService.getById(id));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // Admin endpoints
    @GetMapping("/admin/size-guides")
    public ResponseEntity<?> getAll() {
        try {
            return ResponseEntity.ok(sizeGuideService.getAll());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin/size-guides")
    public ResponseEntity<?> create(@RequestBody SizeGuide guide) {
        try {
            return ResponseEntity.ok(sizeGuideService.create(guide));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/size-guides/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody SizeGuide guide) {
        try {
            return ResponseEntity.ok(sizeGuideService.update(id, guide));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/size-guides/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            sizeGuideService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Size guide deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
