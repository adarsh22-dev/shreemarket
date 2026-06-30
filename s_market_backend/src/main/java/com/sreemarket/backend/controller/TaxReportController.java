package com.sreemarket.backend.controller;

import com.sreemarket.backend.service.TaxReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/tax-reports")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class TaxReportController {

    @Autowired
    private TaxReportService taxReportService;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getTaxDashboard() {
        try {
            Map<String, Object> dashboard = taxReportService.getTaxDashboard();
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/gstr1")
    public ResponseEntity<?> getGSTR1(
            @RequestParam(required = false, defaultValue = "") String periodStart,
            @RequestParam(required = false, defaultValue = "") String periodEnd) {
        try {
            String start = periodStart.isEmpty() ? java.time.LocalDate.now().withDayOfMonth(1).toString() : periodStart;
            String end = periodEnd.isEmpty() ? java.time.LocalDate.now().toString() : periodEnd;
            Map<String, Object> report = taxReportService.generateGSTR1(start, end);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/gstr3b")
    public ResponseEntity<?> getGSTR3B(
            @RequestParam(required = false, defaultValue = "") String periodStart,
            @RequestParam(required = false, defaultValue = "") String periodEnd) {
        try {
            String start = periodStart.isEmpty() ? java.time.LocalDate.now().withDayOfMonth(1).toString() : periodStart;
            String end = periodEnd.isEmpty() ? java.time.LocalDate.now().toString() : periodEnd;
            Map<String, Object> report = taxReportService.generateGSTR3B(start, end);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(defaultValue = "GSTR-3B") String type,
            @RequestParam(required = false, defaultValue = "") String periodStart,
            @RequestParam(required = false, defaultValue = "") String periodEnd) {
        try {
            String start = periodStart.isEmpty() ? java.time.LocalDate.now().withDayOfMonth(1).toString() : periodStart;
            String end = periodEnd.isEmpty() ? java.time.LocalDate.now().toString() : periodEnd;
            String csv = taxReportService.exportReportAsCsv(type, start, end);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"tax_report_" + type + "_" + start + ".csv\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csv.getBytes());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
