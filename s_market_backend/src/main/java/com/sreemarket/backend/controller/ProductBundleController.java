package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.ProductBundle;
import com.sreemarket.backend.service.ProductBundleService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/product-bundles")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class ProductBundleController {

    private final ProductBundleService service;

    public ProductBundleController(ProductBundleService service) {
        this.service = service;
    }

    @GetMapping("/active")
    public ResponseEntity<List<ProductBundle>> getActiveBundles() {
        return ResponseEntity.ok(service.getActiveBundles());
    }

    @GetMapping
    public ResponseEntity<List<ProductBundle>> getAllBundles() {
        return ResponseEntity.ok(service.getAllBundles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductBundle> getBundle(@PathVariable Long id) {
        ProductBundle bundle = service.getBundle(id);
        if (bundle == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(bundle);
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<ProductBundle>> getVendorBundles(@PathVariable Long vendorId) {
        return ResponseEntity.ok(service.getVendorBundles(vendorId));
    }

    @PostMapping
    public ResponseEntity<ProductBundle> createBundle(HttpServletRequest request, @RequestBody ProductBundle bundle) {
        if (!AuthUtil.isAdmin() && !AuthUtil.isVendor()) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(service.createBundle(bundle));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductBundle> updateBundle(HttpServletRequest request, @PathVariable Long id, @RequestBody ProductBundle bundle) {
        if (!AuthUtil.isAdmin() && !AuthUtil.isVendor()) {
            return ResponseEntity.status(403).build();
        }
        ProductBundle updated = service.updateBundle(id, bundle);
        if (updated == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBundle(HttpServletRequest request, @PathVariable Long id) {
        if (!AuthUtil.isAdmin()) {
            return ResponseEntity.status(403).build();
        }
        service.deleteBundle(id);
        return ResponseEntity.ok().build();
    }
}
