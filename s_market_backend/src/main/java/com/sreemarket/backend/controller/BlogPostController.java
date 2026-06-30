package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.BlogPost;
import com.sreemarket.backend.service.BlogPostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class BlogPostController {

    @Autowired
    private BlogPostService blogPostService;

    // Public endpoints
    @GetMapping("/blog-posts")
    public ResponseEntity<?> getPublicPosts() {
        try {
            return ResponseEntity.ok(blogPostService.getPublished());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/blog-posts/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(blogPostService.getById(id));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // Admin endpoints
    @GetMapping("/admin/blog-posts")
    public ResponseEntity<?> getAll() {
        try {
            return ResponseEntity.ok(blogPostService.getAll());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin/blog-posts")
    public ResponseEntity<?> create(@RequestBody BlogPost post) {
        try {
            return ResponseEntity.ok(blogPostService.create(post));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/blog-posts/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody BlogPost post) {
        try {
            return ResponseEntity.ok(blogPostService.update(id, post));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/blog-posts/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            blogPostService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Blog post deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
