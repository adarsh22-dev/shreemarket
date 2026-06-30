package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.MarketplaceFee;
import com.sreemarket.backend.service.MarketplaceFeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/marketplace-fees")
@CrossOrigin(origins = "http://localhost:5173")
public class MarketplaceFeeController {

    @Autowired
    private MarketplaceFeeService service;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(fee -> ResponseEntity.ok((Object) fee))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody MarketplaceFee fee) {
        return ResponseEntity.ok(service.create(fee));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody MarketplaceFee fee) {
        return ResponseEntity.ok(service.update(id, fee));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    @PostMapping("/calculate")
    public ResponseEntity<?> calculateFee(@RequestBody Map<String, Object> request) {
        Double orderTotal = request.get("orderTotal") != null
                ? Double.parseDouble(request.get("orderTotal").toString()) : 0.0;
        String category = request.get("category") != null ? request.get("category").toString() : null;
        return ResponseEntity.ok(service.calculateFee(orderTotal, category));
    }
}
