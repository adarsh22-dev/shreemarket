package com.sreemarket.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreemarket.backend.model.CustomerSegment;
import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.RecentlyViewed;
import com.sreemarket.backend.model.User;
import com.sreemarket.backend.repository.CustomerSegmentRepository;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.repository.RecentlyViewedRepository;
import com.sreemarket.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CustomerSegmentService {

    @Autowired
    private CustomerSegmentRepository segmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RecentlyViewedRepository recentlyViewedRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Predefined segments that get seeded on first run
    private static final List<SegmentSeed> DEFAULT_SEGMENTS = Arrays.asList(
        new SegmentSeed("High-Value Customers", "Customers with total spend above ₹10,000", "#6366f1", "crown", "{\"minTotalSpent\":10000}"),
        new SegmentSeed("Frequent Buyers", "Customers with 5 or more orders", "#16a34a", "repeat", "{\"minOrders\":5}"),
        new SegmentSeed("New Customers", "Customers who joined in the last 30 days", "#2563eb", "user-plus", "{\"maxDaysSinceJoin\":30}"),
        new SegmentSeed("At-Risk Customers", "No order in the last 60 days", "#d97706", "alert-triangle", "{\"minDaysSinceLastOrder\":60}"),
        new SegmentSeed("VIP Customers", "Customers with total spend above ₹50,000", "#E03E1A", "star", "{\"minTotalSpent\":50000}"),
        new SegmentSeed("One-Time Buyers", "Customers with exactly 1 order", "#64748b", "user", "{\"exactOrders\":1}")
    );

    @PostConstruct
    public void seedDefaults() {
        if (segmentRepository.count() > 0) return;
        for (SegmentSeed seed : DEFAULT_SEGMENTS) {
            CustomerSegment seg = new CustomerSegment();
            seg.setName(seed.name);
            seg.setDescription(seed.desc);
            seg.setColor(seed.color);
            seg.setIcon(seed.icon);
            seg.setCriteria(seed.criteria);
            seg.setIsActive(true);
            seg.setCustomerCount(0);
            segmentRepository.save(seg);
        }
        // Recalculate all counts
        recalculateAllCounts();
    }

    public List<CustomerSegment> getAll() {
        return segmentRepository.findAll();
    }

    public List<CustomerSegment> getActive() {
        return segmentRepository.findByIsActiveTrue();
    }

    public CustomerSegment getById(Long id) {
        return segmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Segment not found with id: " + id));
    }

    public CustomerSegment create(CustomerSegment segment) {
        if (segment.getName() == null || segment.getName().trim().isEmpty()) {
            throw new RuntimeException("Segment name is required");
        }
        if (segment.getColor() == null || segment.getColor().isEmpty()) {
            segment.setColor("#6366f1");
        }
        if (segment.getIsActive() == null) segment.setIsActive(true);
        if (segment.getCustomerCount() == null) segment.setCustomerCount(0);
        CustomerSegment saved = segmentRepository.save(segment);
        // Calculate matching customers
        int count = countMatchingCustomers(saved.getCriteria());
        saved.setCustomerCount(count);
        return segmentRepository.save(saved);
    }

    public CustomerSegment update(Long id, CustomerSegment updated) {
        CustomerSegment existing = getById(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getColor() != null) existing.setColor(updated.getColor());
        if (updated.getIcon() != null) existing.setIcon(updated.getIcon());
        if (updated.getCriteria() != null) existing.setCriteria(updated.getCriteria());
        if (updated.getIsActive() != null) existing.setIsActive(updated.getIsActive());
        CustomerSegment saved = segmentRepository.save(existing);
        // Recalculate count
        int count = countMatchingCustomers(saved.getCriteria());
        saved.setCustomerCount(count);
        return segmentRepository.save(saved);
    }

    public CustomerSegment toggleStatus(Long id) {
        CustomerSegment existing = getById(id);
        existing.setIsActive(!existing.getIsActive());
        return segmentRepository.save(existing);
    }

    public void delete(Long id) {
        if (!segmentRepository.existsById(id)) {
            throw new RuntimeException("Segment not found with id: " + id);
        }
        segmentRepository.deleteById(id);
    }

    public void recalculateAllCounts() {
        List<CustomerSegment> all = segmentRepository.findAll();
        for (CustomerSegment seg : all) {
            int count = countMatchingCustomers(seg.getCriteria());
            seg.setCustomerCount(count);
            segmentRepository.save(seg);
        }
    }

    public List<Map<String, Object>> getCustomersInSegment(Long segmentId) {
        CustomerSegment segment = getById(segmentId);
        List<User> allCustomers = userRepository.findByRoleId(2L);
        List<Order> allOrders = orderRepository.findAll();
        List<Product> allProducts = productRepository.findAll();
        JsonNode criteria = parseCriteria(segment.getCriteria());

        return allCustomers.stream()
            .filter(c -> matchesCriteria(c, allOrders, allProducts, criteria))
            .map(c -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", c.getId());
                map.put("fullName", c.getFullName());
                map.put("email", c.getEmail());
                map.put("phone", c.getPhone());
                map.put("status", c.getStatus());
                map.put("createdAt", c.getCreatedAt());
                return map;
            })
            .collect(Collectors.toList());
    }

    public Map<String, Object> getSegmentStats() {
        List<CustomerSegment> segments = segmentRepository.findAll();
        long totalCustomers = userRepository.countByRoleId(2L);
        long activeSegments = segments.stream().filter(s -> Boolean.TRUE.equals(s.getIsActive())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSegments", segments.size());
        stats.put("activeSegments", activeSegments);
        stats.put("totalCustomers", totalCustomers);
        stats.put("segments", segments);
        return stats;
    }

    private int countMatchingCustomers(String criteriaJson) {
        List<User> allCustomers = userRepository.findByRoleId(2L);
        List<Order> allOrders = orderRepository.findAll();
        List<Product> allProducts = productRepository.findAll();
        JsonNode criteria = parseCriteria(criteriaJson);
        return (int) allCustomers.stream()
            .filter(c -> matchesCriteria(c, allOrders, allProducts, criteria))
            .count();
    }

    private boolean matchesCriteria(User customer, List<Order> allOrders, List<Product> allProducts, JsonNode criteria) {
        if (criteria == null) return false;

        // Get customer's orders
        List<Order> customerOrders = allOrders.stream()
            .filter(o -> o.getUserId() != null && o.getUserId().equals(customer.getId()))
            .collect(Collectors.toList());

        double totalSpent = customerOrders.stream()
            .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0)
            .sum();

        int orderCount = customerOrders.size();

        long daysSinceJoin = customer.getCreatedAt() != null
            ? (System.currentTimeMillis() - customer.getCreatedAt()) / (1000 * 60 * 60 * 24)
            : 999;

        long daysSinceLastOrder = 999;
        if (!customerOrders.isEmpty()) {
            OptionalLong lastOrderTime = customerOrders.stream()
                .mapToLong(o -> o.getDatePlaced() != null ? o.getDatePlaced() : 0)
                .max();
            if (lastOrderTime.isPresent() && lastOrderTime.getAsLong() > 0) {
                daysSinceLastOrder = (System.currentTimeMillis() - lastOrderTime.getAsLong()) / (1000 * 60 * 60 * 24);
            }
        }

        // Build product ID to category map for category analysis
        Map<Long, String> productCategoryMap = new HashMap<>();
        Map<Long, String> productSubCategoryMap = new HashMap<>();
        for (Product p : allProducts) {
            if (p.getId() != null) {
                if (p.getCategory() != null) productCategoryMap.put(p.getId(), p.getCategory());
                if (p.getSubCategory() != null) productSubCategoryMap.put(p.getId(), p.getSubCategory());
            }
        }

        // Collect purchased categories
        Set<String> purchasedCategories = new HashSet<>();
        Set<String> purchasedSubCategories = new HashSet<>();
        Set<Long> purchasedProductIds = new HashSet<>();

        for (Order order : customerOrders) {
            if (order.getProductQuantities() != null) {
                for (Map.Entry<Long, Integer> entry : order.getProductQuantities().entrySet()) {
                    Long productId = entry.getKey();
                    purchasedProductIds.add(productId);
                    String cat = productCategoryMap.get(productId);
                    String subCat = productSubCategoryMap.get(productId);
                    if (cat != null) purchasedCategories.add(cat);
                    if (subCat != null) purchasedSubCategories.add(subCat);
                }
            }
        }

        // Collect viewed categories (from recently viewed products)
        Set<String> viewedCategories = new HashSet<>();
        Set<String> viewedSubCategories = new HashSet<>();
        List<RecentlyViewed> recentlyViewed = recentlyViewedRepository.findByUserIdOrderByViewedAtDesc(customer.getId());
        for (RecentlyViewed rv : recentlyViewed) {
            if (rv.getProductId() != null) {
                String cat = productCategoryMap.get(rv.getProductId());
                String subCat = productSubCategoryMap.get(rv.getProductId());
                if (cat != null) viewedCategories.add(cat);
                if (subCat != null) viewedSubCategories.add(subCat);
            }
        }

        // Calculate purchase frequency (orders per month)
        double ordersPerMonth = 0;
        if (daysSinceJoin > 0 && orderCount > 0) {
            double monthsSinceJoin = daysSinceJoin / 30.0;
            ordersPerMonth = orderCount / Math.max(monthsSinceJoin, 1.0/30.0);
        }

        // Calculate average order value
        double avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

        // Check each criterion
        if (criteria.has("minTotalSpent") && totalSpent < criteria.get("minTotalSpent").asDouble()) return false;
        if (criteria.has("maxTotalSpent") && totalSpent > criteria.get("maxTotalSpent").asDouble()) return false;
        if (criteria.has("minOrders") && orderCount < criteria.get("minOrders").asInt()) return false;
        if (criteria.has("maxOrders") && orderCount > criteria.get("maxOrders").asInt()) return false;
        if (criteria.has("exactOrders") && orderCount != criteria.get("exactOrders").asInt()) return false;
        if (criteria.has("maxDaysSinceJoin") && daysSinceJoin > criteria.get("maxDaysSinceJoin").asLong()) return false;
        if (criteria.has("minDaysSinceLastOrder") && daysSinceLastOrder < criteria.get("minDaysSinceLastOrder").asLong()) return false;
        if (criteria.has("maxDaysSinceLastOrder") && daysSinceLastOrder > criteria.get("maxDaysSinceLastOrder").asLong()) return false;

        // New criteria: Category-based filters
        if (criteria.has("purchasedCategories")) {
            JsonNode cats = criteria.get("purchasedCategories");
            if (cats.isArray()) {
                boolean hasAny = false;
                for (JsonNode cat : cats) {
                    if (purchasedCategories.contains(cat.asText())) { hasAny = true; break; }
                }
                if (!hasAny) return false;
            }
        }
        if (criteria.has("purchasedSubCategories")) {
            JsonNode cats = criteria.get("purchasedSubCategories");
            if (cats.isArray()) {
                boolean hasAny = false;
                for (JsonNode cat : cats) {
                    if (purchasedSubCategories.contains(cat.asText())) { hasAny = true; break; }
                }
                if (!hasAny) return false;
            }
        }
        if (criteria.has("notPurchasedCategories")) {
            JsonNode cats = criteria.get("notPurchasedCategories");
            if (cats.isArray()) {
                for (JsonNode cat : cats) {
                    if (purchasedCategories.contains(cat.asText())) return false;
                }
            }
        }

        // New criteria: Viewed categories (products viewed but not necessarily purchased)
        if (criteria.has("viewedCategories")) {
            JsonNode cats = criteria.get("viewedCategories");
            if (cats.isArray()) {
                boolean hasAny = false;
                for (JsonNode cat : cats) {
                    if (viewedCategories.contains(cat.asText())) { hasAny = true; break; }
                }
                if (!hasAny) return false;
            }
        }
        if (criteria.has("viewedSubCategories")) {
            JsonNode cats = criteria.get("viewedSubCategories");
            if (cats.isArray()) {
                boolean hasAny = false;
                for (JsonNode cat : cats) {
                    if (viewedSubCategories.contains(cat.asText())) { hasAny = true; break; }
                }
                if (!hasAny) return false;
            }
        }
        if (criteria.has("notViewedCategories")) {
            JsonNode cats = criteria.get("notViewedCategories");
            if (cats.isArray()) {
                for (JsonNode cat : cats) {
                    if (viewedCategories.contains(cat.asText())) return false;
                }
            }
        }

        // New criteria: Purchase frequency
        if (criteria.has("minOrdersPerMonth") && ordersPerMonth < criteria.get("minOrdersPerMonth").asDouble()) return false;
        if (criteria.has("maxOrdersPerMonth") && ordersPerMonth > criteria.get("maxOrdersPerMonth").asDouble()) return false;

        // New criteria: Average order value
        if (criteria.has("minAvgOrderValue") && avgOrderValue < criteria.get("minAvgOrderValue").asDouble()) return false;
        if (criteria.has("maxAvgOrderValue") && avgOrderValue > criteria.get("maxAvgOrderValue").asDouble()) return false;

        // New criteria: Category diversity (number of unique categories purchased)
        if (criteria.has("minCategoryDiversity") && purchasedCategories.size() < criteria.get("minCategoryDiversity").asInt()) return false;
        if (criteria.has("maxCategoryDiversity") && purchasedCategories.size() > criteria.get("maxCategoryDiversity").asInt()) return false;

        // New criteria: Total unique products purchased
        if (criteria.has("minUniqueProducts") && purchasedProductIds.size() < criteria.get("minUniqueProducts").asInt()) return false;
        if (criteria.has("maxUniqueProducts") && purchasedProductIds.size() > criteria.get("maxUniqueProducts").asInt()) return false;

        return true;
    }

    private JsonNode parseCriteria(String json) {
        if (json == null || json.isEmpty()) return null;
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            return null;
        }
    }

    private static class SegmentSeed {
        final String name, desc, color, icon, criteria;
        SegmentSeed(String name, String desc, String color, String icon, String criteria) {
            this.name = name; this.desc = desc; this.color = color;
            this.icon = icon; this.criteria = criteria;
        }
    }
}
