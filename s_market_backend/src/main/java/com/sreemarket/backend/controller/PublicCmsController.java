package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.CmsPage;
import com.sreemarket.backend.model.Faq;
import com.sreemarket.backend.model.HelpArticle;
import com.sreemarket.backend.service.AdminCmsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cms")
public class PublicCmsController {

    @Autowired
    private AdminCmsService cmsService;

    @GetMapping("/pages/{slug}")
    public ResponseEntity<?> getPageBySlug(@PathVariable String slug) {
        try {
            List<CmsPage> pages = cmsService.getAllCmsPages();
            CmsPage page = pages.stream()
                .filter(p -> p.getSlug() != null && p.getSlug().equalsIgnoreCase(slug) && "published".equals(p.getStatus()))
                .findFirst()
                .orElse(null);
            if (page == null) {
                return ResponseEntity.ok(Map.of("error", "Page not found"));
            }
            return ResponseEntity.ok(page);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/faqs")
    public ResponseEntity<?> getPublishedFaqs() {
        try {
            List<Faq> all = cmsService.getAllFaqs();
            List<Faq> published = all.stream()
                .filter(f -> "published".equals(f.getStatus()))
                .collect(Collectors.toList());
            return ResponseEntity.ok(published);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/help-articles")
    public ResponseEntity<?> getHelpArticles() {
        try {
            List<HelpArticle> articles = cmsService.getAllHelpArticles();
            return ResponseEntity.ok(articles);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
