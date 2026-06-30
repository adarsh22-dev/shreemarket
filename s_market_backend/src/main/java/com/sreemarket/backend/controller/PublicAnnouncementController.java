package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Announcement;
import com.sreemarket.backend.service.AnnouncementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class PublicAnnouncementController {

    private final AnnouncementService service;

    public PublicAnnouncementController(AnnouncementService service) {
        this.service = service;
    }

    @GetMapping("/active")
    public ResponseEntity<List<Announcement>> getActiveAnnouncements() {
        return ResponseEntity.ok(service.getActiveAnnouncements());
    }

    @GetMapping("/audience/{audience}")
    public ResponseEntity<List<Announcement>> getForAudience(@PathVariable String audience) {
        return ResponseEntity.ok(service.getAnnouncementsForAudience(audience));
    }
}
