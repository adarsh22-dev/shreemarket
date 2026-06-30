package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.AuditLog;
import com.sreemarket.backend.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/audit-logs")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String severity) {
        try {
            Page<AuditLog> auditPage = auditLogService.getAuditLogs(page, size, search, severity);

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm").withZone(ZoneId.systemDefault());

            List<Map<String, Object>> items = auditPage.getContent().stream().map(log -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", log.getId());
                m.put("admin", log.getAdminName());
                m.put("adminId", log.getAdminId());
                m.put("action", log.getAction());
                m.put("module", log.getModule());
                m.put("ip", log.getIpAddress());
                m.put("ts", dtf.format(Instant.ofEpochMilli(log.getTimestamp())));
                m.put("severity", log.getSeverity());
                m.put("details", log.getDetails());
                return m;
            }).collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("content", items);
            result.put("totalPages", auditPage.getTotalPages());
            result.put("totalElements", auditPage.getTotalElements());
            result.put("number", auditPage.getNumber());
            result.put("size", auditPage.getSize());
            result.put("first", auditPage.isFirst());
            result.put("last", auditPage.isLast());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
