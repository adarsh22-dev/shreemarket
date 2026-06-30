package com.sreemarket.backend.controller;

import com.sreemarket.backend.service.BulkStockService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/bulk-stock")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class BulkStockController {

    private final BulkStockService bulkStockService;

    public BulkStockController(BulkStockService bulkStockService) {
        this.bulkStockService = bulkStockService;
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv(HttpServletRequest request) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        byte[] data = bulkStockService.exportStockCsv(null);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=stock_export.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(data);
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(HttpServletRequest request) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        byte[] data = bulkStockService.exportStockExcel(null);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=stock_export.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @PostMapping("/import")
    public ResponseEntity<BulkStockService.ImportResult> importStock(HttpServletRequest request,
                                                                       @RequestParam("file") MultipartFile file) {
        if (!AuthUtil.isAdmin()) return ResponseEntity.status(403).build();
        BulkStockService.ImportResult result = bulkStockService.importStock(file, null);
        return ResponseEntity.ok(result);
    }
}
