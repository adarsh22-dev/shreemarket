package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.NewsletterCampaign;
import com.sreemarket.backend.service.NewsletterSendingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/newsletter")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class NewsletterSendingController {

    @Autowired
    private NewsletterSendingService newsletterSendingService;

    @PostMapping("/send/{id}")
    public ResponseEntity<?> sendCampaign(@PathVariable Long id) {
        try {
            NewsletterCampaign campaign = newsletterSendingService.sendCampaign(id);
            return ResponseEntity.ok(campaign);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/send/{id}/content")
    public ResponseEntity<?> sendWithContent(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String htmlContent = body.getOrDefault("htmlContent", null);
            String textContent = body.getOrDefault("textContent", null);
            NewsletterCampaign campaign = newsletterSendingService.sendCampaignWithContent(id, htmlContent, textContent);
            return ResponseEntity.ok(campaign);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
