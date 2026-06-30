package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.HomepageSection;
import com.sreemarket.backend.service.HomepageSectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HomepageSectionController {

    @Autowired
    private HomepageSectionService service;

    @GetMapping("/homepage-sections")
    public ResponseEntity<List<HomepageSection>> getVisibleSections() {
        return ResponseEntity.ok(service.getVisibleSections());
    }

    @GetMapping("/admin/homepage-sections")
    public ResponseEntity<List<HomepageSection>> getAllSections() {
        return ResponseEntity.ok(service.getAllSections());
    }

    @PostMapping("/admin/homepage-sections")
    public ResponseEntity<?> createSection(@RequestBody HomepageSection section) {
        try {
            return ResponseEntity.ok(service.saveSection(section));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/homepage-sections/{id}")
    public ResponseEntity<?> updateSection(@PathVariable Long id, @RequestBody HomepageSection section) {
        try {
            return ResponseEntity.ok(service.updateSection(id, section));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/homepage-sections/{id}")
    public ResponseEntity<?> deleteSection(@PathVariable Long id) {
        try {
            service.deleteSection(id);
            return ResponseEntity.ok(Map.of("message", "Section deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/homepage-sections/batch")
    public ResponseEntity<?> saveAllSections(@RequestBody List<HomepageSection> sections) {
        try {
            return ResponseEntity.ok(service.saveAll(sections));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
