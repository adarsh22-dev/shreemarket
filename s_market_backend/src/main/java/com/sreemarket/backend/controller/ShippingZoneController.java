package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.ShippingZone;
import com.sreemarket.backend.service.ShippingZoneService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/shipping-zones")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class ShippingZoneController {

    private final ShippingZoneService service;

    public ShippingZoneController(ShippingZoneService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ShippingZone>> getAllZones(HttpServletRequest request) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(service.getAllZones());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ShippingZone>> getActiveZones() {
        return ResponseEntity.ok(service.getActiveZones());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShippingZone> getZone(HttpServletRequest request, @PathVariable Long id) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        ShippingZone zone = service.getZone(id);
        if (zone == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(zone);
    }

    @PostMapping
    public ResponseEntity<ShippingZone> createZone(HttpServletRequest request, @RequestBody ShippingZone zone) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(service.createZone(zone));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShippingZone> updateZone(HttpServletRequest request, @PathVariable Long id, @RequestBody ShippingZone zone) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        ShippingZone updated = service.updateZone(id, zone);
        if (updated == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteZone(HttpServletRequest request, @PathVariable Long id) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        service.deleteZone(id);
        return ResponseEntity.ok().build();
    }
}
