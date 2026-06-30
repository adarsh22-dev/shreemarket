package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Announcement;
import com.sreemarket.backend.service.AnnouncementService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/announcements")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class AnnouncementController {

    private final AnnouncementService service;

    public AnnouncementController(AnnouncementService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<Announcement>> getAllAnnouncements(HttpServletRequest request) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(service.getAllAnnouncements());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Announcement> getAnnouncement(HttpServletRequest request, @PathVariable Long id) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        Announcement announcement = service.getAnnouncement(id);
        if (announcement == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(announcement);
    }

    @PostMapping
    public ResponseEntity<Announcement> createAnnouncement(HttpServletRequest request, @RequestBody Announcement announcement) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(service.createAnnouncement(announcement));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Announcement> updateAnnouncement(HttpServletRequest request, @PathVariable Long id, @RequestBody Announcement announcement) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        Announcement updated = service.updateAnnouncement(id, announcement);
        if (updated == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnnouncement(HttpServletRequest request, @PathVariable Long id) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        service.deleteAnnouncement(id);
        return ResponseEntity.ok().build();
    }
}
