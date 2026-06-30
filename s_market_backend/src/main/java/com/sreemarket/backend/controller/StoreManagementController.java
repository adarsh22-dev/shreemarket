package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Store;
import com.sreemarket.backend.repository.StoreRepository;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor/stores")
public class StoreManagementController {

    @Autowired
    private StoreRepository storeRepository;

    @GetMapping
    public ResponseEntity<?> getVendorStores(HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        List<Store> stores = storeRepository.findByVendorId(vendorId);
        return ResponseEntity.ok(stores);
    }

    @PostMapping
    public ResponseEntity<?> createStore(@RequestBody Store store, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        com.sreemarket.backend.model.Vendor vendor = new com.sreemarket.backend.model.Vendor();
        vendor.setId(vendorId);
        store.setVendor(vendor);
        Store saved = storeRepository.save(store);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{storeId}")
    public ResponseEntity<?> updateStore(@PathVariable Long storeId, @RequestBody Store storeUpdate,
                                          HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Store existing = storeRepository.findById(storeId)
                .orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        if (!existing.getVendor().getId().equals(vendorId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        if (storeUpdate.getStoreName() != null) existing.setStoreName(storeUpdate.getStoreName());
        if (storeUpdate.getDescription() != null) existing.setDescription(storeUpdate.getDescription());
        if (storeUpdate.getCity() != null) existing.setCity(storeUpdate.getCity());
        if (storeUpdate.getState() != null) existing.setState(storeUpdate.getState());
        if (storeUpdate.getCountry() != null) existing.setCountry(storeUpdate.getCountry());
        if (storeUpdate.getPincode() != null) existing.setPincode(storeUpdate.getPincode());
        if (storeUpdate.getPhoneNumber() != null) existing.setPhoneNumber(storeUpdate.getPhoneNumber());
        if (storeUpdate.getEmailAddress() != null) existing.setEmailAddress(storeUpdate.getEmailAddress());
        if (storeUpdate.getFullAddress() != null) existing.setFullAddress(storeUpdate.getFullAddress());
        if (storeUpdate.getStoreLogo() != null) existing.setStoreLogo(storeUpdate.getStoreLogo());
        Store saved = storeRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{storeId}")
    public ResponseEntity<?> deleteStore(@PathVariable Long storeId, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Store existing = storeRepository.findById(storeId).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        if (!existing.getVendor().getId().equals(vendorId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        storeRepository.deleteById(storeId);
        return ResponseEntity.noContent().build();
    }
}
