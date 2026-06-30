package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.WholesaleRFQ;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.repository.WholesaleRFQRepository;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/wholesaler/rfqs")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class WholesalerRFQController {

    @Autowired
    private WholesaleRFQRepository rfqRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<?> getMyRfqs(HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        try {
            List<WholesaleRFQ> rfqs = rfqRepository.findByWholesalerIdOrderByCreatedAtDesc(userId);
            return ResponseEntity.ok(rfqs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createRfq(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long userId = AuthUtil.getAuthenticatedUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        try {
            Long productId = ((Number) body.get("productId")).longValue();
            Integer quantity = ((Number) body.get("quantity")).intValue();
            Double requestedPrice = body.get("requestedPrice") != null ? ((Number) body.get("requestedPrice")).doubleValue() : null;
            String notes = (String) body.getOrDefault("notes", "");

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            WholesaleRFQ rfq = new WholesaleRFQ();
            rfq.setWholesalerId(userId);
            rfq.setVendorId(product.getVendorId());
            rfq.setProductId(productId);
            rfq.setProductName(product.getName());
            rfq.setQuantity(quantity);
            rfq.setRequestedPrice(requestedPrice);
            rfq.setNotes(notes);
            rfq.setStatus("PENDING");
            long now = Instant.now().toEpochMilli();
            rfq.setCreatedAt(now);
            rfq.setUpdatedAt(now);
            rfqRepository.save(rfq);
            return ResponseEntity.ok(Map.of("success", true, "message", "RFQ submitted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
