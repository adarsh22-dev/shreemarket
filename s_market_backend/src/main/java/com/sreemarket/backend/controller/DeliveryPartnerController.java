package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.DeliveryPartner;
import com.sreemarket.backend.service.DeliveryPartnerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/delivery-partners")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class DeliveryPartnerController {

    @Autowired
    private DeliveryPartnerService service;

    @GetMapping
    public ResponseEntity<List<DeliveryPartner>> getAll() {
        return ResponseEntity.ok(service.getAll());
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
    public ResponseEntity<DeliveryPartner> create(@RequestBody DeliveryPartner partner) {
        return ResponseEntity.ok(service.create(partner));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody DeliveryPartner partner) {
        try {
            return ResponseEntity.ok(service.update(id, partner));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Delivery partner deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
