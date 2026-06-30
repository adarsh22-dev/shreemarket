package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.SavedPaymentMethod;
import com.sreemarket.backend.service.SavedPaymentMethodService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/payment-methods")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class SavedPaymentMethodController {

    private final SavedPaymentMethodService service;

    public SavedPaymentMethodController(SavedPaymentMethodService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<SavedPaymentMethod>> getUserMethods(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(service.getUserPaymentMethods(userId));
    }

    @PostMapping
    public ResponseEntity<SavedPaymentMethod> saveMethod(HttpServletRequest request, @RequestBody SavedPaymentMethod method) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        method.setUserId(userId);
        return ResponseEntity.ok(service.savePaymentMethod(method));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMethod(HttpServletRequest request, @PathVariable Long id) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        service.deletePaymentMethod(id, userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<SavedPaymentMethod> setDefault(HttpServletRequest request, @PathVariable Long id) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(service.setDefault(id, userId));
    }
}
