package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.UserDevice;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.repository.UserDeviceRepository;
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

    @Autowired
    private UserDeviceRepository userDeviceRepository;

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

        // Customer Demographics (from delivery locations)
        List<Map<String, Object>> demographics = getDemographics(orders);

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

    /**
     * Returns detailed analytics for a single product belonging to this vendor.
     * Includes units sold, revenue, estimated views, add-to-cart rate,
     * conversion rate, monthly sales trend, and review summary.
     */
    public Map<String, Object> getProductAnalytics(Long vendorId, Long productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null || !vendorId.equals(product.getVendorId())) {
            throw new RuntimeException("Product not found or not owned by this vendor");
        }

        List<Order> orders = orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);

        // Aggregate order data for this specific product
        int totalUnitsSold = 0;
        double totalRevenue = 0;
        int orderCount = 0;
        List<Map<String, Object>> monthlySales = new ArrayList<>();
        Map<String, Integer> monthlyUnits = new HashMap<>();
        Map<String, Double> monthlyRevenue = new HashMap<>();

        for (Order order : orders) {
            if (order.getProductQuantities() != null && order.getProductQuantities().containsKey(productId)) {
                int qty = order.getProductQuantities().get(productId);
                totalUnitsSold += qty;
                orderCount++;

                String month = "";
                if (order.getDatePlaced() != null) {
                    LocalDateTime date = LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(order.getDatePlaced()), ZoneId.systemDefault());
                    month = date.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH).toUpperCase();
                }

                double unitPrice = product.getDiscountPrice() != null ? product.getDiscountPrice()
                        : (product.getRegularPrice() != null ? product.getRegularPrice() : 0);
                double lineRevenue = unitPrice * qty;
                totalRevenue += lineRevenue;

                monthlyUnits.put(month, monthlyUnits.getOrDefault(month, 0) + qty);
                monthlyRevenue.put(month, monthlyRevenue.getOrDefault(month, 0.0) + lineRevenue);
            }
        }

        // Build monthly trend
        String[] months = {"JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"};
        double maxUnits = monthlyUnits.values().stream().mapToInt(Integer::intValue).max().orElse(1);
        for (String m : months) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("month", m);
            int units = monthlyUnits.getOrDefault(m, 0);
            entry.put("units", units);
            entry.put("revenue", monthlyRevenue.getOrDefault(m, 0.0));
            entry.put("height", maxUnits > 0 ? (int)((units / maxUnits) * 100) + "%" : "0%");
            monthlySales.add(entry);
        }

        // Reviews
        int reviewCount = product.getReviewCount() != null ? product.getReviewCount() : 0;
        double avgRating = product.getAverageRating() != null ? product.getAverageRating() : 0.0;

        // Estimated views (mock - based on units sold x 50 + stock views)
        int estimatedViews = totalUnitsSold * 50 + (reviewCount * 200) + 100;
        int addToCarts = (int) (estimatedViews * 0.15); // ~15% view-to-cart
        double conversionRate = estimatedViews > 0 ? (double) totalUnitsSold / estimatedViews * 100 : 0;
        double addToCartRate = estimatedViews > 0 ? (double) addToCarts / estimatedViews * 100 : 0;

        // Growth vs previous period (mock logic using first/last half)
        String growth = "+0%";
        if (monthlySales.size() >= 6) {
            int firstHalf = monthlySales.subList(0, 6).stream().mapToInt(m -> (int) m.get("units")).sum();
            int secondHalf = monthlySales.subList(6, 12).stream().mapToInt(m -> (int) m.get("units")).sum();
            if (firstHalf > 0) {
                double g = ((double)(secondHalf - firstHalf) / firstHalf) * 100;
                growth = String.format("%+.1f%%", g);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("productId", product.getId());
        result.put("productName", product.getName());
        result.put("sku", product.getSku());
        result.put("category", product.getCategory());
        result.put("price", product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getRegularPrice());
        result.put("stock", product.getInitialStock());
        result.put("status", product.getStatus());
        result.put("unitsSold", totalUnitsSold);
        result.put("totalRevenue", totalRevenue);
        result.put("orderCount", orderCount);
        result.put("estimatedViews", estimatedViews);
        result.put("addToCarts", addToCarts);
        result.put("addToCartRate", Math.round(addToCartRate * 10) / 10.0);
        result.put("conversionRate", Math.round(conversionRate * 10) / 10.0);
        result.put("avgRating", Math.round(avgRating * 10) / 10.0);
        result.put("reviewCount", reviewCount);
        result.put("growth", growth);
        result.put("monthlySales", monthlySales);

        // Product image
        String image = null;
        if (product.getMedia() != null && !product.getMedia().isEmpty()) {
            image = product.getMedia().get(0).getFileName();
        }
        result.put("image", image);

        return result;
    }

    /**
     * Returns enriched customer demographics for a vendor, including:
     * - Location breakdown (city, state from delivery locations)
     * - Device breakdown (browser, OS, device type from UserDevice records)
     * - Customer insights (new vs returning, repeat purchase rate)
     */
    public Map<String, Object> getVendorDemographics(Long vendorId) {
        List<Order> orders = orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);
        Map<String, Object> result = new HashMap<>();

        // ── Location Demographics ──
        List<Map<String, Object>> cities = new ArrayList<>();
        List<Map<String, Object>> states = new ArrayList<>();
        Map<String, Integer> cityCounts = new HashMap<>();
        Map<String, Double> cityRevenue = new HashMap<>();
        Map<String, Integer> stateCounts = new HashMap<>();
        Map<String, Double> stateRevenue = new HashMap<>();

        for (Order order : orders) {
            String loc = order.getDeliveryLocation();
            if (loc == null || loc.trim().isEmpty()) continue;
            loc = loc.trim();

            String city = loc;
            String state = "Unknown";
            if (loc.contains(",")) {
                String[] parts = loc.split(",");
                city = parts[0].trim();
                state = parts.length > 1 ? parts[parts.length - 1].trim() : "Unknown";
            }

            cityCounts.put(city, cityCounts.getOrDefault(city, 0) + 1);
            cityRevenue.put(city, cityRevenue.getOrDefault(city, 0.0) + (order.getTotalAmount() != null ? order.getTotalAmount() : 0));
            stateCounts.put(state, stateCounts.getOrDefault(state, 0) + 1);
            stateRevenue.put(state, stateRevenue.getOrDefault(state, 0.0) + (order.getTotalAmount() != null ? order.getTotalAmount() : 0));
        }

        int totalOrdersForLoc = orders.size();
        int maxCityCount = cityCounts.values().stream().max(Integer::compare).orElse(1);
        cityCounts.forEach((name, count) -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("city", name);
            entry.put("orders", count);
            entry.put("revenue", cityRevenue.getOrDefault(name, 0.0));
            entry.put("percentage", totalOrdersForLoc > 0 ? Math.round((count * 100.0 / totalOrdersForLoc) * 10.0) / 10.0 : 0);
            entry.put("width", (int) ((count * 100.0) / maxCityCount));
            cities.add(entry);
        });

        int maxStateCount = stateCounts.values().stream().max(Integer::compare).orElse(1);
        stateCounts.forEach((name, count) -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("state", name);
            entry.put("orders", count);
            entry.put("revenue", stateRevenue.getOrDefault(name, 0.0));
            entry.put("percentage", totalOrdersForLoc > 0 ? Math.round((count * 100.0 / totalOrdersForLoc) * 10.0) / 10.0 : 0);
            entry.put("width", (int) ((count * 100.0) / maxStateCount));
            states.add(entry);
        });

        cities.sort((a, b) -> Integer.compare((int) b.get("orders"), (int) a.get("orders")));
        states.sort((a, b) -> Integer.compare((int) b.get("orders"), (int) a.get("orders")));

        result.put("cities", cities);
        result.put("states", states);

        // ── Device Demographics ──
        // Collect unique customer user IDs from orders
        Set<Long> customerUserIds = orders.stream()
            .map(Order::getUserId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        List<UserDevice> customerDevices = customerUserIds.isEmpty()
            ? new ArrayList<>()
            : userDeviceRepository.findByUserIdInAndRoleId(customerUserIds, 2L); // roleId 2 = Customer

        Map<String, Integer> browserCounts = new HashMap<>();
        Map<String, Integer> osCounts = new HashMap<>();
        Map<String, Integer> deviceTypeCounts = new HashMap<>();

        for (UserDevice dev : customerDevices) {
            String b = dev.getBrowser() != null ? dev.getBrowser() : "Unknown";
            String o = dev.getOs() != null ? dev.getOs() : "Unknown";
            String dt = dev.getDeviceType() != null ? dev.getDeviceType() : "Desktop";
            browserCounts.put(b, browserCounts.getOrDefault(b, 0) + 1);
            osCounts.put(o, osCounts.getOrDefault(o, 0) + 1);
            deviceTypeCounts.put(dt, deviceTypeCounts.getOrDefault(dt, 0) + 1);
        }

        result.put("browsers", buildPercentageList(browserCounts));
        result.put("operatingSystems", buildPercentageList(osCounts));
        result.put("deviceTypes", buildPercentageList(deviceTypeCounts));

        // ── Customer Insights ──
        Map<Long, Integer> customerOrderCount = new HashMap<>();
        for (Order order : orders) {
            if (order.getUserId() != null) {
                customerOrderCount.put(order.getUserId(),
                    customerOrderCount.getOrDefault(order.getUserId(), 0) + 1);
            }
        }

        int totalUniqueCustomers = customerOrderCount.size();
        long repeatCustomers = customerOrderCount.values().stream().filter(c -> c >= 2).count();
        long singlePurchaseCustomers = totalUniqueCustomers - repeatCustomers;
        double repeatRate = totalUniqueCustomers > 0 ? Math.round((repeatCustomers * 100.0 / totalUniqueCustomers) * 10.0) / 10.0 : 0;
        double avgOrdersPerCustomer = totalUniqueCustomers > 0 ? Math.round(((double) orders.size() / totalUniqueCustomers) * 10.0) / 10.0 : 0;

        Map<String, Object> customerInsights = new HashMap<>();
        customerInsights.put("totalUniqueCustomers", totalUniqueCustomers);
        customerInsights.put("singlePurchaseCustomers", singlePurchaseCustomers);
        customerInsights.put("repeatCustomers", repeatCustomers);
        customerInsights.put("repeatRate", repeatRate);
        customerInsights.put("avgOrdersPerCustomer", avgOrdersPerCustomer);
        customerInsights.put("totalOrders", orders.size());
        result.put("customerInsights", customerInsights);

        // ── Summary ──
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalLocations", cities.size());
        summary.put("topCity", cities.isEmpty() ? "N/A" : (String) cities.get(0).get("city"));
        summary.put("topState", states.isEmpty() ? "N/A" : (String) states.get(0).get("state"));
        summary.put("topBrowser", browserCounts.entrySet().stream()
            .max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("N/A"));
        summary.put("topOs", osCounts.entrySet().stream()
            .max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("N/A"));
        summary.put("topDevice", deviceTypeCounts.entrySet().stream()
            .max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("N/A"));
        result.put("summary", summary);

        return result;
    }

    private List<Map<String, Object>> buildPercentageList(Map<String, Integer> counts) {
        int total = counts.values().stream().mapToInt(Integer::intValue).sum();
        if (total == 0) return new ArrayList<>();

        int maxCount = counts.values().stream().max(Integer::compare).orElse(1);
        List<Map<String, Object>> list = new ArrayList<>();
        counts.forEach((key, val) -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("label", key);
            entry.put("count", val);
            entry.put("percentage", Math.round((val * 100.0 / total) * 10.0) / 10.0);
            entry.put("width", (int) ((val * 100.0) / maxCount));
            list.add(entry);
        });
        list.sort((a, b) -> Integer.compare((int) b.get("count"), (int) a.get("count")));
        return list;
    }

    private List<Map<String, Object>> getDemographics(List<Order> orders) {
        int totalOrders = orders.size();

        if (totalOrders == 0) {
            return new ArrayList<>();
        }

        // Group by delivery location
        Map<String, Integer> locationCounts = new HashMap<>();
        for (Order order : orders) {
            String location = order.getDeliveryLocation();
            String key = (location != null && !location.trim().isEmpty()) ? location.trim() : "India";
            locationCounts.put(key, locationCounts.getOrDefault(key, 0) + 1);
        }

        int maxCount = locationCounts.values().stream().max(Integer::compare).orElse(1);

        List<Map<String, Object>> result = new ArrayList<>();
        locationCounts.forEach((location, count) -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("country", location);
            // width is relative to the highest bar (100% for max)
            entry.put("width", (int) ((count * 100.0) / maxCount) + "%");
            // val is the percentage of total orders
            entry.put("val", Math.round((count * 100.0) / totalOrders) + "%");
            result.add(entry);
        });

        return result.stream()
                .sorted((a, b) -> {
                    int aCount = locationCounts.getOrDefault((String) a.get("country"), 0);
                    int bCount = locationCounts.getOrDefault((String) b.get("country"), 0);
                    return Integer.compare(bCount, aCount);
                })
                .limit(6)
                .collect(Collectors.toList());
    }
}
