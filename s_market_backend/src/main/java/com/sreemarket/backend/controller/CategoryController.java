package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Category;
import com.sreemarket.backend.model.SubCategory;
import com.sreemarket.backend.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    // ── Categories ──

    @GetMapping
    public ResponseEntity<?> getAllCategories() {
        try {
            List<Map<String, Object>> categories = categoryService.getAllCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable Long id) {
        try {
            Category category = categoryService.getCategoryById(id);
            return ResponseEntity.ok(category);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createCategory(@RequestBody Category category) {
        try {
            Category created = categoryService.createCategory(category);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Category category) {
        try {
            Category updated = categoryService.updateCategory(id, category);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            categoryService.deleteCategory(id);
            return ResponseEntity.ok(Map.of("message", "Category deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Sub-categories ──

    @GetMapping("/subcategories")
    public ResponseEntity<?> getAllSubCategories() {
        try {
            List<Map<String, Object>> subs = categoryService.getAllSubCategories();
            return ResponseEntity.ok(subs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{categoryId}/subcategories")
    public ResponseEntity<?> createSubCategory(@PathVariable Long categoryId, @RequestBody SubCategory subCategory) {
        try {
            SubCategory created = categoryService.createSubCategory(categoryId, subCategory);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/subcategories/{id}")
    public ResponseEntity<?> updateSubCategory(
            @PathVariable Long id,
            @RequestParam(required = false) Long categoryId,
            @RequestBody SubCategory subCategory) {
        try {
            SubCategory updated = categoryService.updateSubCategory(id, categoryId, subCategory);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/subcategories/{id}")
    public ResponseEntity<?> deleteSubCategory(@PathVariable Long id) {
        try {
            categoryService.deleteSubCategory(id);
            return ResponseEntity.ok(Map.of("message", "Sub-category deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
