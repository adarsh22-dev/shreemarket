package com.sreemarket.backend.controller;

import com.sreemarket.backend.service.TrashService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/trash")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class TrashController {

    @Autowired
    private TrashService trashService;

    @GetMapping
    public ResponseEntity<?> getTrashedItems(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<Map<String, Object>> items = trashService.getTrashedItems(type, search, page, size);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("content", items.getContent());
            response.put("totalElements", items.getTotalElements());
            response.put("totalPages", items.getTotalPages());
            response.put("number", items.getNumber());
            response.put("size", items.getSize());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getTrashStats() {
        try {
            return ResponseEntity.ok(trashService.getTrashStats());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{type}/{id}/restore")
    public ResponseEntity<?> restoreItem(@PathVariable String type, @PathVariable Long id) {
        try {
            Map<String, Object> result = trashService.restoreItem(type, id);
            return ResponseEntity.ok(Map.of("message", "Item restored successfully", "item", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{type}/{id}")
    public ResponseEntity<?> permanentDelete(@PathVariable String type, @PathVariable Long id) {
        try {
            trashService.permanentDelete(type, id);
            return ResponseEntity.ok(Map.of("message", "Item permanently deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/empty")
    public ResponseEntity<?> emptyTrash() {
        try {
            int count = trashService.emptyTrash();
            return ResponseEntity.ok(Map.of("message", "Trash emptied", "deletedCount", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/auto-purge")
    public ResponseEntity<?> autoPurge() {
        try {
            int count = trashService.autoPurgeOldTrash();
            return ResponseEntity.ok(Map.of("message", "Auto-purge completed", "deletedCount", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
