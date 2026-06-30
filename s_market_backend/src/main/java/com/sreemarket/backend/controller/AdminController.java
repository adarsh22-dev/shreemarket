package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.Review;
import com.sreemarket.backend.model.User;
import com.sreemarket.backend.service.AdminService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private AdminService adminService;

    // ── Dashboard Stats ──
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        try {
            Map<String, Object> stats = adminService.getDashboardStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Failed to load dashboard stats", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── All Orders (paginated) ──
    @GetMapping("/orders")
    public ResponseEntity<?> getAllOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "datePlaced") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Page<Order> orders = adminService.getAllOrders(search, status, page, size, sortBy, sortDir);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── All Customers (paginated) ──
    @GetMapping("/customers")
    public ResponseEntity<?> getAllCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Page<User> customers = adminService.getAllCustomers(search, status, page, size, sortBy, sortDir);
            return ResponseEntity.ok(customers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Update Customer Status ──
    @PutMapping("/customers/{id}/status")
    public ResponseEntity<?> updateCustomerStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String newStatus = body.get("status");
            User user = adminService.updateCustomerStatus(id, newStatus);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── All Products (paginated for admin) ──
    @GetMapping("/products")
    public ResponseEntity<?> getAllProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Page<Product> products = adminService.getAllProducts(search, category, status, approvalStatus, page, size, sortBy, sortDir);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Update Product Status ──
    @PutMapping("/products/{id}/status")
    public ResponseEntity<?> updateProductStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String newStatus = body.get("status");
            Product product = adminService.updateProductStatus(id, newStatus);
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Update Product Approval Status ──
    @PutMapping("/products/{id}/approval-status")
    public ResponseEntity<?> updateProductApprovalStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String newApprovalStatus = body.get("approvalStatus");
            if (newApprovalStatus == null || newApprovalStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "approvalStatus is required"));
            }
            Product product = adminService.updateProductApprovalStatus(id, newApprovalStatus);
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── All Reviews (paginated) ──
    @GetMapping("/reviews")
    public ResponseEntity<?> getAllReviews(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Page<Review> reviews = adminService.getAllReviews(search, page, size, sortBy, sortDir);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Delete Review ──
    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        try {
            adminService.deleteReview(id);
            return ResponseEntity.ok(Map.of("message", "Review deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
