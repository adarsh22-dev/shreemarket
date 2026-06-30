package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Wholesaler;
import com.sreemarket.backend.service.WholesalerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AdminWholesalerController {

    @Autowired
    private WholesalerService wholesalerService;

    @GetMapping("/wholesalers")
    public ResponseEntity<?> listWholesalers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<Wholesaler> result = wholesalerService.listWholesalers(search, status, page, size);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/wholesalers/{id}")
    public ResponseEntity<?> getWholesaler(@PathVariable Long id) {
        try {
            Wholesaler wholesaler = wholesalerService.getWholesalerById(id);
            return ResponseEntity.ok(wholesaler);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/wholesalers/{id}/approve")
    public ResponseEntity<?> approveWholesaler(@PathVariable Long id) {
        try {
            Wholesaler updated = wholesalerService.updateWholesalerStatus(id, "Active");
            return ResponseEntity.ok(Map.of("message", "Wholesaler approved successfully", "wholesalerId", updated.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/wholesalers/{id}/reject")
    public ResponseEntity<?> rejectWholesaler(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        try {
            Wholesaler updated = wholesalerService.updateWholesalerStatus(id, "Rejected");
            return ResponseEntity.ok(Map.of("message", "Wholesaler rejected", "wholesalerId", updated.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/wholesalers/{id}/suspend")
    public ResponseEntity<?> suspendWholesaler(@PathVariable Long id) {
        try {
            Wholesaler updated = wholesalerService.updateWholesalerStatus(id, "Suspended");
            return ResponseEntity.ok(Map.of("message", "Wholesaler suspended", "wholesalerId", updated.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
