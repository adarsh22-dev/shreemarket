package com.sreemarket.backend.service;

import com.sreemarket.backend.model.InventoryAlert;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.repository.InventoryAlertRepository;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InventoryAlertService {

    @Autowired
    private InventoryAlertRepository alertRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private VendorRepository vendorRepository;

    // ── Global configurable thresholds ──
    private int criticalThreshold = 0;   // Out of stock
    private int warningThreshold = 5;    // Below 5 units
    private int lowThreshold = 15;       // Below 15 units
    private boolean autoScanEnabled = true;

    // ── Category-specific thresholds: category -> [critical, warning, low] ──
    // When a category has its own thresholds, they override the global ones.
    private final Map<String, int[]> categoryThresholds = new LinkedHashMap<>();

    {
        // Default category thresholds
        categoryThresholds.put("Electronics", new int[]{5, 15, 30});
        categoryThresholds.put("Grocery", new int[]{10, 25, 50});
        categoryThresholds.put("Fashion", new int[]{3, 10, 20});
        categoryThresholds.put("Home & Kitchen", new int[]{5, 15, 30});
        categoryThresholds.put("Health & Household", new int[]{5, 15, 25});
    }

    public List<InventoryAlert> getAll() {
        return alertRepository.findAll();
    }

    public List<InventoryAlert> getByStatus(String status) {
        return alertRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    public List<InventoryAlert> getByVendor(Long vendorId) {
        return alertRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);
    }

    public List<InventoryAlert> getBySeverity(String severity) {
        return alertRepository.findBySeverityOrderByCreatedAtDesc(severity);
    }

    public Optional<InventoryAlert> getById(Long id) {
        return alertRepository.findById(id);
    }

    public InventoryAlert acknowledge(Long id) {
        InventoryAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + id));
        alert.setStatus("ACKNOWLEDGED");
        alert.setAcknowledgedAt(System.currentTimeMillis());
        return alertRepository.save(alert);
    }

    public InventoryAlert resolve(Long id, String notes) {
        InventoryAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + id));
        alert.setStatus("RESOLVED");
        alert.setResolvedAt(System.currentTimeMillis());
        if (notes != null) alert.setNotes(notes);
        return alertRepository.save(alert);
    }

    public InventoryAlert dismiss(Long id) {
        InventoryAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + id));
        alert.setStatus("DISMISSED");
        return alertRepository.save(alert);
    }

    public InventoryAlert updateNotes(Long id, String notes) {
        InventoryAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + id));
        alert.setNotes(notes);
        return alertRepository.save(alert);
    }

    /**
     * Scan all products across all vendors and create/resolve alerts based on thresholds.
     * Returns a summary of the scan.
     */
    public Map<String, Object> scanAllProducts() {
        List<Product> allProducts = productRepository.findAll();
        List<Vendor> allVendors = vendorRepository.findAll();
        Map<Long, String> vendorNames = allVendors.stream()
                .collect(Collectors.toMap(Vendor::getId, v -> v.getFullName() != null ? v.getFullName() : "Vendor #" + v.getId()));

        int newAlerts = 0;
        int resolvedAlerts = 0;
        int unchanged = 0;

        // Get existing active alerts by product ID
        List<InventoryAlert> existingAlerts = alertRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
        Map<Long, InventoryAlert> activeAlertsByProduct = existingAlerts.stream()
                .collect(Collectors.toMap(InventoryAlert::getProductId, a -> a, (a, b) -> a));

        Set<Long> scannedProductIds = new HashSet<>();

        for (Product product : allProducts) {
            if (product.getInitialStock() == null) continue;
            if ("draft".equals(product.getStatus())) continue;

            int stock = product.getInitialStock();
            scannedProductIds.add(product.getId());

            String severity = determineSeverity(stock, product.getCategory());
            InventoryAlert existing = activeAlertsByProduct.get(product.getId());

            if (severity != null) {
                // Product needs an alert
                if (existing != null) {
                    // Update existing alert if stock changed
                    if (!existing.getCurrentStock().equals(stock)) {
                        existing.setCurrentStock(stock);
                        existing.setThreshold(getThresholdForSeverity(severity, product.getCategory()));
                        existing.setSeverity(severity);
                        alertRepository.save(existing);
                    }
                    unchanged++;
                } else {
                    // Create new alert
                    InventoryAlert alert = new InventoryAlert();
                    alert.setProductId(product.getId());
                    alert.setProductName(product.getName());
                    alert.setProductSku(product.getSku());
                    alert.setProductCategory(product.getCategory());
                    alert.setVendorId(product.getVendorId());
                    alert.setVendorName(vendorNames.getOrDefault(product.getVendorId(), "Unknown"));
                    alert.setCurrentStock(stock);
                    alert.setThreshold(getThresholdForSeverity(severity, product.getCategory()));
                    alert.setSeverity(severity);
                    alert.setStatus("ACTIVE");
                    alertRepository.save(alert);
                    newAlerts++;
                }
            } else if (existing != null) {
                // Stock is back above threshold — auto-resolve
                existing.setStatus("RESOLVED");
                existing.setResolvedAt(System.currentTimeMillis());
                existing.setNotes("Auto-resolved: stock replenished to " + stock);
                alertRepository.save(existing);
                resolvedAlerts++;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalProductsScanned", allProducts.size());
        result.put("productsWithAlerts", activeAlertsByProduct.size() + newAlerts);
        result.put("newAlerts", newAlerts);
        result.put("resolvedAlerts", resolvedAlerts);
        result.put("unchanged", unchanged);
        result.put("scanTime", System.currentTimeMillis());
        return result;
    }

    public Map<String, Object> getThresholds() {
        Map<String, Object> thresholds = new LinkedHashMap<>();
        thresholds.put("criticalThreshold", criticalThreshold);
        thresholds.put("warningThreshold", warningThreshold);
        thresholds.put("lowThreshold", lowThreshold);
        thresholds.put("autoScanEnabled", autoScanEnabled);
        // Category-specific thresholds
        Map<String, Object> catMap = new LinkedHashMap<>();
        for (Map.Entry<String, int[]> e : categoryThresholds.entrySet()) {
            Map<String, Integer> ct = new LinkedHashMap<>();
            ct.put("critical", e.getValue()[0]);
            ct.put("warning", e.getValue()[1]);
            ct.put("low", e.getValue()[2]);
            catMap.put(e.getKey(), ct);
        }
        thresholds.put("categoryThresholds", catMap);
        return thresholds;
    }

    public Map<String, Object> updateThresholds(Map<String, Object> updates) {
        if (updates.containsKey("criticalThreshold")) {
            criticalThreshold = ((Number) updates.get("criticalThreshold")).intValue();
        }
        if (updates.containsKey("warningThreshold")) {
            warningThreshold = ((Number) updates.get("warningThreshold")).intValue();
        }
        if (updates.containsKey("lowThreshold")) {
            lowThreshold = ((Number) updates.get("lowThreshold")).intValue();
        }
        if (updates.containsKey("autoScanEnabled")) {
            autoScanEnabled = Boolean.TRUE.equals(updates.get("autoScanEnabled"));
        }
        // Category-specific thresholds
        if (updates.containsKey("categoryThresholds")) {
            Object catObj = updates.get("categoryThresholds");
            if (catObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> catUpdates = (Map<String, Object>) catObj;
                for (Map.Entry<String, Object> e : catUpdates.entrySet()) {
                    String cat = e.getKey();
                    Object val = e.getValue();
                    if (val == null) {
                        categoryThresholds.remove(cat);
                    } else if (val instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Number> tv = (Map<String, Number>) val;
                        int c = tv.containsKey("critical") ? tv.get("critical").intValue() : criticalThreshold;
                        int w = tv.containsKey("warning") ? tv.get("warning").intValue() : warningThreshold;
                        int l = tv.containsKey("low") ? tv.get("low").intValue() : lowThreshold;
                        categoryThresholds.put(cat, new int[]{c, w, l});
                    }
                }
            }
        }
        return getThresholds();
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        long totalActive = alertRepository.countByStatus("ACTIVE");
        long totalAck = alertRepository.countByStatus("ACKNOWLEDGED");
        long totalResolved = alertRepository.countByStatus("RESOLVED");
        long totalDismissed = alertRepository.countByStatus("DISMISSED");

        long criticalCount = alertRepository.countBySeverity("CRITICAL");
        long warningCount = alertRepository.countBySeverity("WARNING");
        long lowCount = alertRepository.countBySeverity("LOW");

        // Count unique vendors affected
        List<InventoryAlert> activeAlerts = alertRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
        Set<Long> affectedVendors = activeAlerts.stream()
                .map(InventoryAlert::getVendorId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Count out-of-stock products
        long outOfStock = activeAlerts.stream()
                .filter(a -> "CRITICAL".equals(a.getSeverity()))
                .count();

        stats.put("totalActive", totalActive);
        stats.put("totalAcknowledged", totalAck);
        stats.put("totalResolved", totalResolved);
        stats.put("totalDismissed", totalDismissed);
        stats.put("criticalCount", criticalCount);
        stats.put("warningCount", warningCount);
        stats.put("lowCount", lowCount);
        stats.put("affectedVendors", affectedVendors.size());
        stats.put("outOfStockProducts", outOfStock);
        return stats;
    }

    /**
     * Get products that are low on stock across all vendors (live scan, no alert entity needed).
     */
    public List<Map<String, Object>> getLowStockProducts() {
        List<Product> allProducts = productRepository.findAll();
        List<Vendor> allVendors = vendorRepository.findAll();
        Map<Long, String> vendorNames = allVendors.stream()
                .collect(Collectors.toMap(Vendor::getId, v -> v.getFullName() != null ? v.getFullName() : "Vendor #" + v.getId()));

        return allProducts.stream()
                .filter(p -> p.getInitialStock() != null && !"draft".equals(p.getStatus()))
                .filter(p -> {
                    int effLow = lowThreshold;
                    if (p.getCategory() != null && categoryThresholds.containsKey(p.getCategory())) {
                        effLow = categoryThresholds.get(p.getCategory())[2];
                    }
                    return p.getInitialStock() <= effLow;
                })
                .sorted(Comparator.comparingInt(Product::getInitialStock))
                .map(p -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", p.getId());
                    item.put("name", p.getName());
                    item.put("sku", p.getSku());
                    item.put("category", p.getCategory());
                    item.put("stock", p.getInitialStock());
                    item.put("vendorId", p.getVendorId());
                    item.put("vendorName", vendorNames.getOrDefault(p.getVendorId(), "Unknown"));
                    item.put("severity", determineSeverity(p.getInitialStock(), p.getCategory()));
                    item.put("status", p.getStatus());
                    return item;
                })
                .collect(Collectors.toList());
    }

    private String determineSeverity(int stock, String category) {
        int crit = criticalThreshold;
        int warn = warningThreshold;
        int low = lowThreshold;
        if (category != null && categoryThresholds.containsKey(category)) {
            int[] t = categoryThresholds.get(category);
            crit = t[0]; warn = t[1]; low = t[2];
        }
        if (stock <= crit) return "CRITICAL";
        if (stock <= warn) return "WARNING";
        if (stock <= low) return "LOW";
        return null;
    }

    private int getThresholdForSeverity(String severity, String category) {
        int crit = criticalThreshold;
        int warn = warningThreshold;
        int low = lowThreshold;
        if (category != null && categoryThresholds.containsKey(category)) {
            int[] t = categoryThresholds.get(category);
            crit = t[0]; warn = t[1]; low = t[2];
        }
        switch (severity) {
            case "CRITICAL": return crit;
            case "WARNING": return warn;
            case "LOW": return low;
            default: return 0;
        }
    }
}
