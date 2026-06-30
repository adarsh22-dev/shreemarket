package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.PayoutSchedule;
import com.sreemarket.backend.service.PayoutScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/payout-schedules")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PayoutScheduleController {

    @Autowired
    private PayoutScheduleService service;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String status,
                                     @RequestParam(required = false) String search) {
        try {
            if (search != null && !search.isEmpty()) return ResponseEntity.ok(service.search(search));
            if (status != null && !status.isEmpty()) return ResponseEntity.ok(service.getByStatus(status));
            return ResponseEntity.ok(service.getAll());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PayoutSchedule schedule) {
        try {
            return ResponseEntity.ok(service.save(schedule));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody PayoutSchedule schedule) {
        try {
            schedule.setId(id);
            return ResponseEntity.ok(service.save(schedule));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
