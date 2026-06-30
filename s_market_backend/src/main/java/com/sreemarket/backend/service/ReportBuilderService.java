package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportBuilderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private VendorRepository vendorRepository;

    /**
     * Generate a sales report for the given date range.
     */
    public Map<String, Object> generateSalesReport(String startDate, String endDate) {
        long startMs = parseDate(startDate, 0);
        long endMs = parseDate(endDate, 86399999);

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getDatePlaced() != null && o.getDatePlaced() >= startMs && o.getDatePlaced() <= endMs)
                .collect(Collectors.toList());

        double totalRevenue = orders.stream().mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();
        double totalTax = orders.stream().mapToDouble(o -> o.getTaxAmount() != null ? o.getTaxAmount() : 0).sum();
        int totalOrders = orders.size();

        // Daily breakdown
        Map<String, List<Order>> dailyOrders = new TreeMap<>();
        for (Order o : orders) {
            String day = Instant.ofEpochMilli(o.getDatePlaced()).atZone(ZoneId.systemDefault()).toLocalDate().toString();
            dailyOrders.computeIfAbsent(day, k -> new ArrayList<>()).add(o);
        }

        List<Map<String, Object>> dailyBreakdown = new ArrayList<>();
        for (Map.Entry<String, List<Order>> entry : dailyOrders.entrySet()) {
            Map<String, Object> day = new HashMap<>();
            day.put("date", entry.getKey());
            day.put("orders", entry.getValue().size());
            day.put("revenue", entry.getValue().stream().mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum());
            day.put("tax", entry.getValue().stream().mapToDouble(o -> o.getTaxAmount() != null ? o.getTaxAmount() : 0).sum());
            dailyBreakdown.add(day);
        }

        // Status breakdown
        Map<String, Integer> statusCounts = new HashMap<>();
        Map<String, Double> statusRevenue = new HashMap<>();
        for (Order o : orders) {
            String s = o.getStatus() != null ? o.getStatus() : "UNKNOWN";
            statusCounts.merge(s, 1, Integer::sum);
            statusRevenue.merge(s, o.getTotalAmount() != null ? o.getTotalAmount() : 0, Double::sum);
        }

        List<Map<String, Object>> statusBreakdown = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : statusCounts.entrySet()) {
            Map<String, Object> row = new HashMap<>();
            row.put("status", entry.getKey());
            row.put("count", entry.getValue());
            row.put("revenue", statusRevenue.get(entry.getKey()));
            statusBreakdown.add(row);
        }

        Map<String, Object> report = new HashMap<>();
        report.put("reportType", "Sales Report");
        report.put("period", startDate + " to " + endDate);
        report.put("generatedAt", new Date().toString());
        report.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        report.put("totalTax", Math.round(totalTax * 100.0) / 100.0);
        report.put("totalOrders", totalOrders);
        report.put("dailyBreakdown", dailyBreakdown);
        report.put("statusBreakdown", statusBreakdown);

        return report;
    }

    /**
     * Generate a products report with stock levels and sales.
     */
    public Map<String, Object> generateProductsReport(String category, String status) {
        List<Product> products = productRepository.findAll();

        if (category != null && !category.isEmpty()) {
            products = products.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(category))
                    .collect(Collectors.toList());
        }
        if (status != null && !status.isEmpty()) {
            products = products.stream()
                    .filter(p -> p.getStatus() != null && p.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> productList = new ArrayList<>();
        for (Product p : products) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", p.getId());
            item.put("name", p.getName());
            item.put("sku", p.getSku());
            item.put("category", p.getCategory());
            item.put("vendorId", p.getVendorId());
            item.put("regularPrice", p.getRegularPrice());
            item.put("discountPrice", p.getDiscountPrice());
            item.put("stock", p.getInitialStock());
            item.put("status", p.getStatus());
            item.put("approvalStatus", p.getApprovalStatus());
            item.put("bookingCount", p.getBookingCount());
            item.put("averageRating", p.getAverageRating());
            productList.add(item);
        }

        long totalProducts = products.size();
        long inStock = products.stream().filter(p -> "in".equalsIgnoreCase(p.getStatus())).count();
        long lowStock = products.stream().filter(p -> "low".equalsIgnoreCase(p.getStatus())).count();
        long outOfStock = products.stream().filter(p -> "out".equalsIgnoreCase(p.getStatus())).count();
        long pendingApproval = products.stream().filter(p -> "Pending".equalsIgnoreCase(p.getApprovalStatus())).count();

        Map<String, Object> report = new HashMap<>();
        report.put("reportType", "Products Report");
        report.put("generatedAt", new Date().toString());
        report.put("totalProducts", totalProducts);
        report.put("inStock", inStock);
        report.put("lowStock", lowStock);
        report.put("outOfStock", outOfStock);
        report.put("pendingApproval", pendingApproval);
        report.put("products", productList);

        return report;
    }

    /**
     * Generate a vendor performance report.
     */
    public Map<String, Object> generateVendorReport(String sortBy, String sortDir) {
        List<Vendor> vendors = vendorRepository.findAll();
        List<Order> allOrders = orderRepository.findAll();

        List<Map<String, Object>> vendorList = new ArrayList<>();
        for (Vendor v : vendors) {
            List<Order> vendorOrders = allOrders.stream()
                    .filter(o -> v.getId().equals(o.getVendorId()))
                    .collect(Collectors.toList());

            double revenue = vendorOrders.stream().mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();
            int orderCount = vendorOrders.size();
            int productCount = productRepository.findByVendorId(v.getId()).size();

            Map<String, Object> item = new HashMap<>();
            item.put("id", v.getId());
            item.put("name", v.getFullName());
            item.put("email", v.getEmail());
            item.put("status", v.getStatus());
            item.put("revenue", Math.round(revenue * 100.0) / 100.0);
            item.put("orders", orderCount);
            item.put("products", productCount);
            item.put("rating", v.getRating());
            item.put("tier", v.getTier());
            vendorList.add(item);
        }

        // Sort
        Comparator<Map<String, Object>> comp;
        if ("revenue".equalsIgnoreCase(sortBy)) {
            comp = Comparator.comparingDouble(m -> (double) m.get("revenue"));
        } else if ("orders".equalsIgnoreCase(sortBy)) {
            comp = Comparator.comparingInt(m -> (int) m.get("orders"));
        } else if ("products".equalsIgnoreCase(sortBy)) {
            comp = Comparator.comparingInt(m -> (int) m.get("products"));
        } else if ("rating".equalsIgnoreCase(sortBy)) {
            comp = Comparator.comparingDouble(m -> (double) m.getOrDefault("rating", 0.0));
        } else {
            comp = Comparator.comparing(m -> (String) m.get("name"));
        }
        if (!"asc".equalsIgnoreCase(sortDir)) {
            comp = comp.reversed();
        }
        vendorList.sort(comp);

        Map<String, Object> report = new HashMap<>();
        report.put("reportType", "Vendor Performance Report");
        report.put("generatedAt", new Date().toString());
        report.put("totalVendors", vendors.size());
        report.put("activeVendors", vendors.stream().filter(v -> "Active".equalsIgnoreCase(v.getStatus())).count());
        report.put("pendingVendors", vendors.stream().filter(v -> "Pending".equalsIgnoreCase(v.getStatus())).count());
        report.put("vendors", vendorList);

        return report;
    }

    /**
     * Export any report as CSV.
     */
    public String exportAsCsv(Map<String, Object> report) {
        StringBuilder csv = new StringBuilder();
        csv.append("Report Type,").append(report.getOrDefault("reportType", "Report")).append("\n");
        csv.append("Generated At,").append(report.getOrDefault("generatedAt", "")).append("\n");
        csv.append("Period,").append(report.getOrDefault("period", "")).append("\n\n");

        // Summary fields
        for (Map.Entry<String, Object> entry : report.entrySet()) {
            if (!(entry.getValue() instanceof List) && !(entry.getValue() instanceof Map)) {
                csv.append(entry.getKey()).append(",").append(entry.getValue()).append("\n");
            }
        }

        // Daily breakdown
        List<Map<String, Object>> daily = (List<Map<String, Object>>) report.get("dailyBreakdown");
        if (daily != null && !daily.isEmpty()) {
            csv.append("\nDaily Breakdown\n");
            csv.append("Date,Orders,Revenue,Tax\n");
            for (Map<String, Object> d : daily) {
                csv.append(d.get("date")).append(",")
                   .append(d.get("orders")).append(",")
                   .append(d.get("revenue")).append(",")
                   .append(d.get("tax")).append("\n");
            }
        }

        // Status breakdown
        List<Map<String, Object>> statusBrk = (List<Map<String, Object>>) report.get("statusBreakdown");
        if (statusBrk != null && !statusBrk.isEmpty()) {
            csv.append("\nStatus Breakdown\n");
            csv.append("Status,Count,Revenue\n");
            for (Map<String, Object> s : statusBrk) {
                csv.append(s.get("status")).append(",")
                   .append(s.get("count")).append(",")
                   .append(s.get("revenue")).append("\n");
            }
        }

        // Products/vendors list
        List<Map<String, Object>> items = (List<Map<String, Object>>) report.get("products");
        if (items == null) items = (List<Map<String, Object>>) report.get("vendors");

        if (items != null && !items.isEmpty()) {
            csv.append("\nDetails\n");
            Set<String> headers = items.get(0).keySet();
            csv.append(String.join(",", headers)).append("\n");
            for (Map<String, Object> item : items) {
                for (String h : headers) {
                    csv.append(item.getOrDefault(h, "")).append(",");
                }
                csv.append("\n");
            }
        }

        return csv.toString();
    }

    private long parseDate(String dateStr, long defaultOffsetMs) {
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ISO_DATE)
                    .atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli() + defaultOffsetMs;
        } catch (Exception e) {
            return LocalDate.now().withDayOfMonth(1)
                    .atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
        }
    }
}
