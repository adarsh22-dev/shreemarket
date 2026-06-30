package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.CompetitorPrice;
import com.sreemarket.backend.service.CompetitorPriceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/competitor-prices")
public class CompetitorPriceController {

    @Autowired
    private CompetitorPriceService competitorPriceService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<CompetitorPrice>> getCompetitorPrices(@PathVariable Long productId) {
        return ResponseEntity.ok(competitorPriceService.getCompetitorPrices(productId));
    }

    @GetMapping("/product/{productId}/comparison")
    public ResponseEntity<Map<String, Object>> getPriceComparison(
            @PathVariable Long productId,
            @RequestParam(required = false) Double ourPrice) {
        return ResponseEntity.ok(competitorPriceService.getPriceComparison(productId, ourPrice));
    }

    @PostMapping
    public ResponseEntity<CompetitorPrice> addCompetitorPrice(@RequestBody CompetitorPrice price) {
        return ResponseEntity.ok(competitorPriceService.addCompetitorPrice(price));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompetitorPrice> updateCompetitorPrice(
            @PathVariable Long id, @RequestBody CompetitorPrice price) {
        return ResponseEntity.ok(competitorPriceService.updateCompetitorPrice(id, price));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCompetitorPrice(@PathVariable Long id) {
        competitorPriceService.deleteCompetitorPrice(id);
        return ResponseEntity.noContent().build();
    }
}
