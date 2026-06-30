package com.sreemarket.backend.controller;

import com.sreemarket.backend.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @GetMapping("/{orderId}/invoice")
    public ResponseEntity<?> downloadInvoice(@PathVariable Long orderId) {
        try {
            String html = invoiceService.generateInvoiceHtml(orderId);
            byte[] bytes = html.getBytes("UTF-8");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoice_" + orderId + ".html\"")
                    .contentType(MediaType.TEXT_HTML)
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Failed to generate invoice: " + e.getMessage()));
        }
    }
}
