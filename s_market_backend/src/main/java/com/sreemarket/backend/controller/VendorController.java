package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Ticket;
import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.repository.VendorRepository;
import com.sreemarket.backend.service.TicketService;
import com.sreemarket.backend.service.VendorService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorController {

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private TicketService ticketService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        try {
            Vendor vendor = vendorService.getVendorById(userId);
            vendor.setPassword(null);
            return ResponseEntity.ok(vendor);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Vendor updated, HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        try {
            Vendor saved = vendorService.updateVendor(userId, updated);
            saved.setPassword(null);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/store-settings")
    public ResponseEntity<?> getStoreSettings(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Vendor vendor = vendorRepository.findById(userId).orElse(null);
        if (vendor == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Vendor not found"));
        }
        String settings = vendor.getSettings();
        if (settings == null) settings = "{}";
        return ResponseEntity.ok(Map.of("settings", settings));
    }

    @PutMapping("/store-settings")
    public ResponseEntity<?> saveStoreSettings(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Vendor vendor = vendorRepository.findById(userId).orElse(null);
        if (vendor == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Vendor not found"));
        }
        Object settingsObj = body.get("settings");
        String settings = settingsObj != null ? settingsObj.toString() : "{}";
        vendor.setSettings(settings);
        vendorRepository.save(vendor);
        return ResponseEntity.ok(Map.of("message", "Settings saved", "settings", settings));
    }

    @GetMapping("/tickets")
    public ResponseEntity<?> getVendorTickets(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        try {
            List<Ticket> tickets = ticketService.getTicketsByCreatedById(userId);
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
