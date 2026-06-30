package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.SubscriberList;
import com.sreemarket.backend.repository.SubscriberListRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/newsletter")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class NewsletterController {

    @Autowired
    private SubscriberListRepository subscriberListRepository;

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }
            SubscriberList sub = new SubscriberList();
            sub.setName(email.trim());
            sub.setListId("newsletter-" + System.currentTimeMillis());
            sub.setCount(0);
            subscriberListRepository.save(sub);
            return ResponseEntity.ok(Map.of("message", "Subscribed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
