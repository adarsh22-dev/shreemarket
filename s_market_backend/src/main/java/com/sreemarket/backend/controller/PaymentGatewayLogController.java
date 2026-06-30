package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.PaymentGatewayLog;
import com.sreemarket.backend.service.PaymentGatewayLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/payment-gateway-logs")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PaymentGatewayLogController {

    @Autowired
    private PaymentGatewayLogService service;

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String gateway,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        try {
            Page<PaymentGatewayLog> logs = service.getAll(page, size, search, gateway, type, status);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PaymentGatewayLog log) {
        try {
            return ResponseEntity.ok(service.save(log));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
