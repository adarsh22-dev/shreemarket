package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.ReviewTemplate;
import com.sreemarket.backend.service.ReviewTemplateService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/vendor/review-templates")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorReviewController {

    @Autowired
    private ReviewTemplateService reviewTemplateService;

    @GetMapping
    public ResponseEntity<?> getTemplates(HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        return ResponseEntity.ok(reviewTemplateService.getTemplates(vendorId));
    }

    @PostMapping
    public ResponseEntity<?> createTemplate(@RequestBody ReviewTemplate template, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        template.setVendorId(vendorId);
        return ResponseEntity.ok(reviewTemplateService.createTemplate(template));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTemplate(@PathVariable Long id, @RequestBody ReviewTemplate template, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        return ResponseEntity.ok(reviewTemplateService.updateTemplate(id, template));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTemplate(@PathVariable Long id, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        reviewTemplateService.deleteTemplate(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
