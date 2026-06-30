package com.sreemarket.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreemarket.backend.model.CustomerSegment;
import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.User;
import com.sreemarket.backend.repository.CustomerSegmentRepository;
import com.sreemarket.backend.repository.OrderRepository;
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
        JsonNode criteria = parseCriteria(segment.getCriteria());

        return allCustomers.stream()
            .filter(c -> matchesCriteria(c, allOrders, criteria))
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
        JsonNode criteria = parseCriteria(criteriaJson);
        return (int) allCustomers.stream()
            .filter(c -> matchesCriteria(c, allOrders, criteria))
            .count();
    }

    private boolean matchesCriteria(User customer, List<Order> allOrders, JsonNode criteria) {
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

        // Check each criterion
        if (criteria.has("minTotalSpent") && totalSpent < criteria.get("minTotalSpent").asDouble()) return false;
        if (criteria.has("maxTotalSpent") && totalSpent > criteria.get("maxTotalSpent").asDouble()) return false;
        if (criteria.has("minOrders") && orderCount < criteria.get("minOrders").asInt()) return false;
        if (criteria.has("maxOrders") && orderCount > criteria.get("maxOrders").asInt()) return false;
        if (criteria.has("exactOrders") && orderCount != criteria.get("exactOrders").asInt()) return false;
        if (criteria.has("maxDaysSinceJoin") && daysSinceJoin > criteria.get("maxDaysSinceJoin").asLong()) return false;
        if (criteria.has("minDaysSinceLastOrder") && daysSinceLastOrder < criteria.get("minDaysSinceLastOrder").asLong()) return false;
        if (criteria.has("maxDaysSinceLastOrder") && daysSinceLastOrder > criteria.get("maxDaysSinceLastOrder").asLong()) return false;

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
