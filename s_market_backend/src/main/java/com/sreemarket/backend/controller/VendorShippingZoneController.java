package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.ShippingZone;
import com.sreemarket.backend.service.ShippingZoneService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendor/shipping-zones")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorShippingZoneController {

    private final ShippingZoneService service;

    public VendorShippingZoneController(ShippingZoneService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ShippingZone>> getMyZones() {
        return ResponseEntity.ok(service.getAllZones());
    }

    @PostMapping
    public ResponseEntity<?> createZone(@RequestBody ShippingZone zone) {
        try {
            return ResponseEntity.ok(service.createZone(zone));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateZone(@PathVariable Long id, @RequestBody ShippingZone zone) {
        try {
            ShippingZone updated = service.updateZone(id, zone);
            if (updated == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteZone(@PathVariable Long id) {
        try {
            service.deleteZone(id);
            return ResponseEntity.ok(java.util.Map.of("message", "Zone deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
