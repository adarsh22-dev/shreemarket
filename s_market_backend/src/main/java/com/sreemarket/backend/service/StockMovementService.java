package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.StockMovement;
import com.sreemarket.backend.repository.StockMovementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StockMovementService {

    @Autowired
    private StockMovementRepository stockMovementRepository;

    /**
     * Log a stock movement.
     */
    @Transactional
    public StockMovement logMovement(Long productId, String productName, String productSku, String productCategory,
                                     Long vendorId, String type, Integer quantity,
                                     Integer previousStock, Integer newStock,
                                     String reference, String createdBy, String notes) {
        StockMovement movement = new StockMovement(
            productId, productName, productSku, productCategory,
            vendorId, type, quantity, previousStock, newStock,
            reference, createdBy, notes
        );
        return stockMovementRepository.save(movement);
    }

    /**
     * Convenience method to log from a Product and its vendor context.
     */
    @Transactional
    public StockMovement logFromProduct(Product product, Long vendorId, String type,
                                        Integer quantity, Integer previousStock, Integer newStock,
                                        String reference, String createdBy, String notes) {
        return logMovement(
            product.getId(),
            product.getName(),
            product.getSku(),
            product.getCategory(),
            vendorId,
            type,
            quantity,
            previousStock,
            newStock,
            reference,
            createdBy,
            notes
        );
    }

    /**
     * Get paginated stock movements for a vendor with optional filters.
     */
    public Page<StockMovement> getVendorMovements(Long vendorId, Long productId, String type,
                                                   String search, LocalDate startDate, LocalDate endDate,
                                                   int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        if (search != null && !search.isEmpty()) {
            return stockMovementRepository.searchByVendor(vendorId, search, pageable);
        }

        Long startEpoch = (startDate != null)
            ? startDate.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
            : null;
        Long endEpoch = (endDate != null)
            ? endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
            : null;

        if (productId != null || type != null || startEpoch != null || endEpoch != null) {
            return stockMovementRepository.findByFilters(vendorId, productId,
                type != null && !type.isEmpty() ? type : null,
                startEpoch, endEpoch, pageable);
        }

        return stockMovementRepository.findByVendorIdOrderByCreatedAtDesc(vendorId, pageable);
    }

    /**
     * Get summary stats for the vendor dashboard.
     */
    public Map<String, Object> getVendorStats(Long vendorId) {
        Map<String, Object> stats = new HashMap<>();

        long totalIn = stockMovementRepository.countByVendorIdAndType(vendorId, "IN");
        long totalOut = stockMovementRepository.countByVendorIdAndType(vendorId, "OUT");
        long totalAdjustments = stockMovementRepository.countByVendorIdAndType(vendorId, "ADJUSTMENT");

        // Last 7 days activity
        long weekAgo = Instant.now().minus(7, ChronoUnit.DAYS).toEpochMilli();
        List<StockMovement> recentMovements = stockMovementRepository.findByVendorIdOrderByCreatedAtDesc(vendorId)
            .stream()
            .filter(m -> m.getCreatedAt() != null && m.getCreatedAt() >= weekAgo)
            .collect(Collectors.toList());

        long weeklyIn = recentMovements.stream().filter(m -> "IN".equals(m.getType())).count();
        long weeklyOut = recentMovements.stream().filter(m -> "OUT".equals(m.getType())).count();

        stats.put("totalIn", totalIn);
        stats.put("totalOut", totalOut);
        stats.put("totalAdjustments", totalAdjustments);
        stats.put("totalMovements", totalIn + totalOut + totalAdjustments);
        stats.put("weeklyIn", weeklyIn);
        stats.put("weeklyOut", weeklyOut);

        // Daily movement chart (last 7 days)
        List<Map<String, Object>> dailyChart = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = LocalDate.now().minus(i, ChronoUnit.DAYS);
            long dayStart = day.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
            long dayEnd = day.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();

            long dayIn = recentMovements.stream()
                .filter(m -> "IN".equals(m.getType()) && m.getCreatedAt() >= dayStart && m.getCreatedAt() < dayEnd)
                .count();
            long dayOut = recentMovements.stream()
                .filter(m -> "OUT".equals(m.getType()) && m.getCreatedAt() >= dayStart && m.getCreatedAt() < dayEnd)
                .count();

            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", day.toString());
            dayData.put("in", dayIn);
            dayData.put("out", dayOut);
            dailyChart.add(dayData);
        }
        stats.put("dailyChart", dailyChart);

        return stats;
    }
}
