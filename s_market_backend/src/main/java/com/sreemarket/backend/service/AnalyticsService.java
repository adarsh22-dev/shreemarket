package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    public Map<String, Object> getVendorAnalytics(Long vendorId) {
        List<Order> orders = orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);
        List<Product> products = productRepository.findByVendorId(vendorId);

        double totalRevenue = orders.stream().mapToDouble(Order::getTotalAmount).sum();
        int totalOrders = orders.size();
        double avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Metric calculations (mock growth for now)
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalRevenue", totalRevenue);
        metrics.put("totalOrders", totalOrders);
        metrics.put("avgOrderValue", avgOrderValue);
        metrics.put("conversionRate", 3.2); // Placeholder
        metrics.put("revenueGrowth", "+12.5%");
        metrics.put("ordersGrowth", "-2.4%");
        metrics.put("avgValueGrowth", "+5.1%");
        metrics.put("conversionGrowth", "+0.4%");

        // Revenue Trends (last 12 months)
        List<Map<String, Object>> trends = getRevenueTrends(orders);

        // Sales by Category
        List<Map<String, Object>> categorySales = getSalesByCategory(orders, products);

        // Top Performing Products
        List<Map<String, Object>> topProducts = getTopProducts(orders, products);

        // Customer Demographics (Mocked)
        List<Map<String, Object>> demographics = getDemographics();

        Map<String, Object> response = new HashMap<>();
        response.put("metrics", metrics);
        response.put("trends", trends);
        response.put("categorySales", categorySales);
        response.put("topProducts", topProducts);
        response.put("demographics", demographics);

        return response;
    }

    private List<Map<String, Object>> getRevenueTrends(List<Order> orders) {
        String[] months = { "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" };
        Map<String, Double> monthlyRevenue = new HashMap<>();

        for (Order order : orders) {
            LocalDateTime date = LocalDateTime.ofInstant(Instant.ofEpochMilli(order.getDatePlaced()),
                    ZoneId.systemDefault());
            String month = date.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH).toUpperCase();
            monthlyRevenue.put(month, monthlyRevenue.getOrDefault(month, 0.0) + order.getTotalAmount());
        }

        List<Map<String, Object>> trends = new ArrayList<>();
        double maxRev = monthlyRevenue.values().stream().max(Double::compare).orElse(100.0);

        for (String m : months) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("month", m);
            double revenue = monthlyRevenue.getOrDefault(m, 0.0);
            entry.put("height", (int) ((revenue / maxRev) * 100) + "%");
            if (m.equals(
                    LocalDateTime.now().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH).toUpperCase())) {
                entry.put("active", true);
            }
            trends.add(entry);
        }
        return trends;
    }

    private List<Map<String, Object>> getSalesByCategory(List<Order> orders, List<Product> vendorProducts) {
        Map<Long, Product> productMap = vendorProducts.stream().collect(Collectors.toMap(Product::getId, p -> p));
        Map<String, Double> categoryTotals = new HashMap<>();
        double total = 0;

        for (Order order : orders) {
            if (order.getProductQuantities() != null) {
                for (Map.Entry<Long, Integer> entry : order.getProductQuantities().entrySet()) {
                    Product p = productMap.get(entry.getKey());
                    if (p != null) {
                        String cat = p.getCategory() != null ? p.getCategory() : "Other";
                        double price = p.getDiscountPrice() != null ? p.getDiscountPrice()
                                : (p.getRegularPrice() != null ? p.getRegularPrice() : 0);
                        double lineTotal = price * entry.getValue();
                        categoryTotals.put(cat, categoryTotals.getOrDefault(cat, 0.0) + lineTotal);
                        total += lineTotal;
                    }
                }
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        double finalTotal = total;
        categoryTotals.forEach((cat, val) -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("category", cat);
            entry.put("value", val);
            entry.put("percentage", finalTotal > 0 ? (int) ((val / finalTotal) * 100) : 0);
            result.add(entry);
        });

        return result.stream()
                .sorted((a, b) -> Double.compare((double) b.get("value"), (double) a.get("value")))
                .limit(3)
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> getTopProducts(List<Order> orders, List<Product> vendorProducts) {
        Map<Long, Integer> productSalesCounts = new HashMap<>();

        for (Order order : orders) {
            if (order.getProductQuantities() != null) {
                order.getProductQuantities().forEach((id, qty) -> {
                    productSalesCounts.put(id, productSalesCounts.getOrDefault(id, 0) + qty);
                });
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Product p : vendorProducts) {
            int soldCount = productSalesCounts.getOrDefault(p.getId(), 0);
            if (soldCount > 0) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("id", p.getId());
                entry.put("name", p.getName());
                entry.put("sku", p.getSku());
                entry.put("category", p.getCategory());
                entry.put("unitsSold", soldCount);
                double unitPrice = p.getDiscountPrice() != null ? p.getDiscountPrice()
                        : (p.getRegularPrice() != null ? p.getRegularPrice() : 0);
                entry.put("revenue", unitPrice * soldCount);
                entry.put("stock", p.getInitialStock());
                entry.put("status", p.getStatus());
                entry.put("growth", "+15%"); // Mock

                String image = "/placeholder-image.png";
                if (p.getMedia() != null && !p.getMedia().isEmpty()) {
                    image = p.getMedia().get(0).getFileName();
                }
                entry.put("image", image);
                result.add(entry);
            }
        }

        return result.stream()
                .sorted((a, b) -> Integer.compare((int) b.get("unitsSold"), (int) a.get("unitsSold")))
                .limit(5)
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> getDemographics() {
        List<Map<String, Object>> demo = new ArrayList<>();
        demo.add(createDemoEntry("USA", "80%", "45%"));
        demo.add(createDemoEntry("CAN", "40%", "22%"));
        demo.add(createDemoEntry("UK", "30%", "18%"));
        demo.add(createDemoEntry("GER", "25%", "15%"));
        return demo;
    }

    private Map<String, Object> createDemoEntry(String country, String width, String val) {
        Map<String, Object> entry = new HashMap<>();
        entry.put("country", country);
        entry.put("width", width);
        entry.put("val", val);
        return entry;
    }
}
