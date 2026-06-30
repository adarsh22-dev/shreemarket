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
@RequestMapping("/api/vendor/bulk-stock")
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174"})
public class VendorBulkStockController {

    private final BulkStockService bulkStockService;

    public VendorBulkStockController(BulkStockService bulkStockService) {
        this.bulkStockService = bulkStockService;
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        byte[] data = bulkStockService.exportStockCsv(userId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=stock_export.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(data);
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        byte[] data = bulkStockService.exportStockExcel(userId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=stock_export.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @PostMapping("/import")
    public ResponseEntity<BulkStockService.ImportResult> importStock(HttpServletRequest request,
                                                                       @RequestParam("file") MultipartFile file) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).build();
        BulkStockService.ImportResult result = bulkStockService.importStock(file, userId);
        return ResponseEntity.ok(result);
    }
}
