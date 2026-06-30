package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.Payout;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.Review;
import com.sreemarket.backend.model.User;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.repository.PayoutRepository;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.repository.ReviewRepository;
import com.sreemarket.backend.repository.UserRepository;
import com.sreemarket.backend.repository.VendorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private PayoutRepository payoutRepository;

    // ── Dashboard Stats ──
    public Map<String, Object> getDashboardStats() {
        try {
            Map<String, Object> stats = new HashMap<>();

            long totalCustomers = userRepository.countByRoleId(2L);
        long totalVendors = vendorRepository.count();
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();
        long totalReviews = reviewRepository.count();

        // Revenue from all orders
        Double totalRevenue = orderRepository.sumTotalAmount();
        if (totalRevenue == null) totalRevenue = 0.0;

        // Today's stats
        long todayStart = LocalDate.now()
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant().toEpochMilli();
        long todayOrders = orderRepository.countByDatePlacedAfter(todayStart);
        Double todayRevenue = orderRepository.sumTotalAmountAfter(todayStart);
        if (todayRevenue == null) todayRevenue = 0.0;

        // Order status counts
        long pendingOrders = orderRepository.countByStatus("PLACED");
        long processingOrders = orderRepository.countByStatus("PROCESSING");
        long shippedOrders = orderRepository.countByStatus("SHIPPED");
        long deliveredOrders = orderRepository.countByStatus("DELIVERED");
        long cancelledOrders = orderRepository.countByStatus("CANCELLED");
        long returnedOrders = orderRepository.countByStatus("RETURN REQUESTED");

        // Pending reviews (no vendor reply)
        long pendingReviews = reviewRepository.count() > 0 ?
                reviewRepository.countByVendorReplyIsNull() : 0;

        stats.put("totalCustomers", totalCustomers);
        stats.put("totalVendors", totalVendors);
        stats.put("totalProducts", totalProducts);
        stats.put("totalOrders", totalOrders);
        stats.put("totalReviews", totalReviews);
        stats.put("totalRevenue", totalRevenue);
        stats.put("todayOrders", todayOrders);
        stats.put("todayRevenue", todayRevenue);
        stats.put("pendingOrders", pendingOrders);
        stats.put("processingOrders", processingOrders);
        stats.put("shippedOrders", shippedOrders);
        stats.put("deliveredOrders", deliveredOrders);
        stats.put("cancelledOrders", cancelledOrders);
        stats.put("returnedOrders", returnedOrders);
        stats.put("pendingReviews", pendingReviews);

        // ── Weekly revenue chart (last 7 days) ──
        long weekAgo = Instant.now().minus(7, ChronoUnit.DAYS).toEpochMilli();
        List<Order> weekOrders = orderRepository.findByDatePlacedAfterOrderByDatePlacedAsc(weekAgo);
        Map<String, Double> dailyRev = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            String day = LocalDate.now().minus(i, ChronoUnit.DAYS)
                    .atStartOfDay(ZoneId.systemDefault()).toString().substring(0, 10);
            dailyRev.put(day, 0.0);
        }
        for (Order o : weekOrders) {
            String day = Instant.ofEpochMilli(o.getDatePlaced())
                    .atZone(ZoneId.systemDefault()).toLocalDate().toString();
            dailyRev.merge(day, o.getTotalAmount() != null ? o.getTotalAmount() : 0.0, Double::sum);
        }
        String[] dayLabels = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
        List<Double> weeklyData = new ArrayList<>();
        List<String> weeklyLabels = new ArrayList<>();
        for (Map.Entry<String, Double> e : dailyRev.entrySet()) {
            weeklyData.add(e.getValue());
            weeklyLabels.add(dayLabels[LocalDate.parse(e.getKey()).getDayOfWeek().getValue() % 7]);
        }
        stats.put("weeklyRevenue", weeklyData);
        stats.put("weeklyLabels", weeklyLabels);

        // ── Monthly revenue chart (last 12 months) ──
        long yearAgo = LocalDate.now().minusMonths(12).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
        List<Order> monthOrders = orderRepository.findByDatePlacedAfterOrderByDatePlacedAsc(yearAgo);
        Map<String, Double> monthlyRev = new LinkedHashMap<>();
        for (int i = 11; i >= 0; i--) {
            LocalDate d = LocalDate.now().minus(i, ChronoUnit.MONTHS);
            monthlyRev.put(d.getYear() + "-" + String.format("%02d", d.getMonthValue()), 0.0);
        }
        for (Order o : monthOrders) {
            LocalDate d = Instant.ofEpochMilli(o.getDatePlaced())
                    .atZone(ZoneId.systemDefault()).toLocalDate();
            String key = d.getYear() + "-" + String.format("%02d", d.getMonthValue());
            monthlyRev.merge(key, o.getTotalAmount() != null ? o.getTotalAmount() : 0.0, Double::sum);
        }
        String[] monthLabels = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        List<Double> monthlyData = new ArrayList<>();
        List<String> monthlyLabelList = new ArrayList<>();
        for (Map.Entry<String, Double> e : monthlyRev.entrySet()) {
            monthlyData.add(e.getValue());
            int m = Integer.parseInt(e.getKey().split("-")[1]);
            monthlyLabelList.add(monthLabels[m - 1]);
        }
        stats.put("monthlyRevenue", monthlyData);
        stats.put("monthlyLabels", monthlyLabelList);

        // ── Revenue by Category (donut chart) ──
        List<Product> allProducts = productRepository.findAll();
        Map<Long, String> productCategoryMap = allProducts.stream()
                .collect(Collectors.toMap(Product::getId, p -> p.getCategory() != null ? p.getCategory() : "Uncategorized"));
        Map<String, Double> catRev = new HashMap<>();
        long yearAgoForCat = yearAgo;
        List<Order> catOrders = orderRepository.findByDatePlacedAfterOrderByDatePlacedAsc(yearAgoForCat);
        for (Order o : catOrders) {
            if (o.getProductQuantities() != null && o.getTotalAmount() != null) {
                long totalQty = o.getProductQuantities().values().stream().mapToInt(q -> q).sum();
                if (totalQty == 0) continue;
                double perUnit = o.getTotalAmount() / totalQty;
                for (Map.Entry<Long, Integer> entry : o.getProductQuantities().entrySet()) {
                    String cat = productCategoryMap.getOrDefault(entry.getKey(), "Uncategorized");
                    catRev.merge(cat, perUnit * entry.getValue(), Double::sum);
                }
            }
        }
        String[] donutColors = {"#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"};
        List<Map<String, Object>> catDonut = new ArrayList<>();
        int ci = 0;
        for (Map.Entry<String, Double> e : catRev.entrySet()) {
            Map<String, Object> seg = new HashMap<>();
            seg.put("label", e.getKey());
            seg.put("pct", Math.round((e.getValue() / Math.max(totalRevenue, 1)) * 100));
            seg.put("color", donutColors[ci % donutColors.length]);
            catDonut.add(seg);
            ci++;
        }
        stats.put("categoryDonut", catDonut);

        // ── Top Vendors ──
        List<com.sreemarket.backend.model.Vendor> allVendors = vendorRepository.findAll();
        List<Map<String, Object>> topVendors = allVendors.stream()
                .sorted((a, b) -> Double.compare(
                        b.getTotalRevenue() != null ? b.getTotalRevenue() : 0,
                        a.getTotalRevenue() != null ? a.getTotalRevenue() : 0))
                .limit(10)
                .map(v -> {
                    Map<String, Object> m = new HashMap<>();
                    String revStr = "₹" + String.format("%,.0f", v.getTotalRevenue() != null ? v.getTotalRevenue() : 0);
                    m.put("name", v.getFullName() != null ? v.getFullName() : "—");
                    m.put("rev", revStr);
                    m.put("sales", revStr);
                    m.put("orders", v.getOrderCount() != null ? v.getOrderCount() : 0);
                    m.put("rating", v.getRating() != null ? v.getRating() : 0);
                    m.put("growth", "+" + ((v.getOrderCount() != null && v.getOrderCount() > 0) ? v.getOrderCount() * 5 : 0) + "%");
                    m.put("tier", v.getTier() != null ? v.getTier() : "Basic");
                    return m;
                })
                .collect(Collectors.toList());
        stats.put("topVendors", topVendors);

        // ── Top Products ──
        List<Map<String, Object>> topProducts = allProducts.stream()
                .sorted((a, b) -> Integer.compare(
                        b.getBookingCount() != null ? b.getBookingCount() : 0,
                        a.getBookingCount() != null ? a.getBookingCount() : 0))
                .limit(10)
                .map(p -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", p.getName() != null ? p.getName() : "—");
                    m.put("vendor", "Vendor #" + (p.getVendorId() != null ? p.getVendorId() : "?"));
                    m.put("sales", p.getBookingCount() != null ? p.getBookingCount() : 0);
                    m.put("revenue", "₹" + String.format("%,.0f", (p.getBookingCount() != null ? p.getBookingCount() : 0) * (p.getDiscountPrice() != null ? p.getDiscountPrice() : p.getRegularPrice() != null ? p.getRegularPrice() : 0)));
                    m.put("stock", p.getInitialStock() != null ? p.getInitialStock() : 0);
                    return m;
                })
                .collect(Collectors.toList());
        stats.put("topProducts", topProducts);

        // ── Recent Payouts ──
        List<Payout> recentPayouts = payoutRepository.findAllByOrderByDateDesc(PageRequest.of(0, 5));
        List<Map<String, Object>> payoutsList = recentPayouts.stream()
                .map(p -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("vendor", p.getVendorName() != null ? p.getVendorName() : "—");
                    m.put("date", p.getDate() != null ? p.getDate() : "—");
                    m.put("method", p.getMethod() != null ? p.getMethod() : "—");
                    m.put("amount", p.getAmount() != null ? p.getAmount() : "₹0");
                    m.put("status", p.getStatus() != null ? p.getStatus() : "Pending");
                    return m;
                })
                .collect(Collectors.toList());
        stats.put("recentPayouts", payoutsList);

        // ── Recent Activity (latest 5 orders) ──
        List<Order> recentOrders = orderRepository.findTop5ByOrderByDatePlacedDesc();
        List<Map<String, Object>> activityList = recentOrders.stream()
                .map(o -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("text", "Order " + (o.getOrderNumber() != null ? o.getOrderNumber() : "#" + o.getId()) + " — " + (o.getStatus() != null ? o.getStatus() : "Placed"));
                    m.put("time", o.getDatePlaced() != null ?
                            java.time.Instant.ofEpochMilli(o.getDatePlaced())
                                    .atZone(java.time.ZoneId.systemDefault()).toLocalDate().toString() : "—");
                    return m;
                })
                .collect(Collectors.toList());
        stats.put("recentActivity", activityList);

        // ── Pending Tasks ──
        long pendingVendors = vendorRepository.findByStatus("Pending", PageRequest.of(0, 1)).getTotalElements();
        List<Map<String, Object>> pendingTasks = new ArrayList<>();
        if (pendingOrders > 0) {
            Map<String, Object> t = new HashMap<>();
            t.put("label", "Pending Orders");
            t.put("count", pendingOrders);
            t.put("color", "#d97706");
            t.put("bg", "#fef3c7");
            t.put("to", "/admin/orders");
            pendingTasks.add(t);
        }
        if (pendingReviews > 0) {
            Map<String, Object> t = new HashMap<>();
            t.put("label", "Pending Reviews");
            t.put("count", pendingReviews);
            t.put("color", "#7c3aed");
            t.put("bg", "#ede9fe");
            t.put("to", "/admin/reviews");
            pendingTasks.add(t);
        }
        if (pendingVendors > 0) {
            Map<String, Object> t = new HashMap<>();
            t.put("label", "Vendor Applications");
            t.put("count", pendingVendors);
            t.put("color", "#2563eb");
            t.put("bg", "#dbeafe");
            t.put("to", "/admin/vendors");
            pendingTasks.add(t);
        }
        stats.put("pendingTasks", pendingTasks);

            return stats;
        } catch (Exception e) {
            log.error("getDashboardStats failed", e);
            throw e;
        }
    }

    // ── All Orders (paginated, searchable, filterable) ──
    public Page<Order> getAllOrders(String search, String status, int page, int size,
            String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        if (status != null && !status.isEmpty() && search != null && !search.isEmpty()) {
            return orderRepository.searchByStatusAndTerm(status, search, pageable);
        } else if (status != null && !status.isEmpty()) {
            return orderRepository.findByStatus(status, pageable);
        } else if (search != null && !search.isEmpty()) {
            return orderRepository.searchByTerm(search, pageable);
        }
        return orderRepository.findAll(pageable);
    }

    // ── All Customers (paginated) ──
    public Page<User> getAllCustomers(String search, String status, int page, int size,
            String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        if (search != null && !search.isEmpty() && status != null && !status.isEmpty()) {
            return userRepository.searchCustomersByStatus(search, status, pageable);
        } else if (search != null && !search.isEmpty()) {
            return userRepository.searchCustomers(search, pageable);
        } else if (status != null && !status.isEmpty()) {
            return userRepository.findByRoleIdAndStatus(2L, status, pageable);
        }
        return userRepository.findByRoleId(2L, pageable);
    }

    // ── Update Customer Status ──
    public User updateCustomerStatus(Long id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        user.setStatus(status);
        return userRepository.save(user);
    }

    // ── All Products (paginated for admin) ──
    public Page<Product> getAllProducts(String search, String category, String status,
            int page, int size, String sortBy, String sortDir) {
        return getAllProducts(search, category, status, null, page, size, sortBy, sortDir);
    }

    public Page<Product> getAllProducts(String search, String category, String status, String approvalStatus,
            int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Product> spec = Specification.where(null);

        if (search != null && !search.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("sku")), "%" + search.toLowerCase() + "%")));
        }
        if (category != null && !category.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), category));
        }
        if (approvalStatus != null && !approvalStatus.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("approvalStatus"), approvalStatus));
        }
        // Map approval-related status values to approvalStatus for backward compatibility
        if (status != null && !status.isEmpty()) {
            if ("Pending".equalsIgnoreCase(status) || "Approved".equalsIgnoreCase(status) || "Rejected".equalsIgnoreCase(status)) {
                spec = spec.and((root, query, cb) -> cb.equal(root.get("approvalStatus"), status));
            } else {
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
            }
        }

        return productRepository.findAll(spec, pageable);
    }

    // ── Update Product Status (approval status) ──
    public Product updateProductStatus(Long id, String status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setStatus(status);
        // When admin sets status to Active/Approved/Rejected, also update approvalStatus
        if ("Approved".equalsIgnoreCase(status) || "Active".equalsIgnoreCase(status)) {
            product.setApprovalStatus("Approved");
        } else if ("Rejected".equalsIgnoreCase(status)) {
            product.setApprovalStatus("Rejected");
        } else if ("Pending".equalsIgnoreCase(status)) {
            product.setApprovalStatus("Pending");
        }
        return productRepository.save(product);
    }

    // ── All Reviews (paginated) ──
    public Page<Review> getAllReviews(String search, int page, int size,
            String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Review> spec = Specification.where(null);

        if (search != null && !search.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("reviewerName")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("title")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("text")), "%" + search.toLowerCase() + "%")));
        }

        return reviewRepository.findAll(spec, pageable);
    }

    // ── Update Product Approval Status ──
    public Product updateProductApprovalStatus(Long id, String approvalStatus) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setApprovalStatus(approvalStatus);
        return productRepository.save(product);
    }

    // ── Delete Review ──
    public void deleteReview(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new RuntimeException("Review not found");
        }
        reviewRepository.deleteById(id);
    }
}
