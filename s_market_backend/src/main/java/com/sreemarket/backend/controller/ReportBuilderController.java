package com.sreemarket.backend.controller;

import com.sreemarket.backend.service.ReportBuilderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class ReportBuilderController {

    @Autowired
    private ReportBuilderService reportBuilderService;

    @GetMapping("/sales")
    public ResponseEntity<?> getSalesReport(
            @RequestParam(required = false, defaultValue = "") String startDate,
            @RequestParam(required = false, defaultValue = "") String endDate) {
        try {
            String start = startDate.isEmpty() ? java.time.LocalDate.now().minusMonths(1).toString() : startDate;
            String end = endDate.isEmpty() ? java.time.LocalDate.now().toString() : endDate;
            return ResponseEntity.ok(reportBuilderService.generateSalesReport(start, end));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/products")
    public ResponseEntity<?> getProductsReport(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status) {
        try {
            return ResponseEntity.ok(reportBuilderService.generateProductsReport(category, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/vendors")
    public ResponseEntity<?> getVendorReport(
            @RequestParam(required = false, defaultValue = "revenue") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {
        try {
            return ResponseEntity.ok(reportBuilderService.generateVendorReport(sortBy, sortDir));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/export/csv")
    public ResponseEntity<byte[]> exportReport(@RequestBody Map<String, Object> reportData) {
        try {
            String csv = reportBuilderService.exportAsCsv(reportData);
            String filename = "report_" + System.currentTimeMillis() + ".csv";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csv.getBytes());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
