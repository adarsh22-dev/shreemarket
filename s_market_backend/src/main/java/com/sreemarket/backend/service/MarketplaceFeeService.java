package com.sreemarket.backend.service;

import com.sreemarket.backend.model.MarketplaceFee;
import com.sreemarket.backend.repository.MarketplaceFeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;

@Service
public class MarketplaceFeeService {

    @Autowired
    private MarketplaceFeeRepository repository;

    @PostConstruct
    public void seedDefaults() {
        if (repository.count() > 0) return;

        MarketplaceFee standard = new MarketplaceFee();
        standard.setName("Standard Platform Fee");
        standard.setFeeType("FLAT");
        standard.setFlatAmount(15.0);
        standard.setPercentage(0.0);
        standard.setApplicableCategories("All");
        standard.setMaxCap(50.0);
        standard.setMinOrderAmount(0.0);
        standard.setActive(true);
        standard.setPriority(1);
        standard.setGstOnFee(true);
        standard.setDescription("Standard platform fee applied per order. Max cap ₹50.");
        standard.setEstimatedRevenue(0.0);
        repository.save(standard);

        MarketplaceFee lowValue = new MarketplaceFee();
        lowValue.setName("Low-Value Order Fee");
        lowValue.setFeeType("FLAT");
        lowValue.setFlatAmount(5.0);
        lowValue.setPercentage(0.0);
        lowValue.setApplicableCategories("All");
        lowValue.setMaxCap(10.0);
        lowValue.setMinOrderAmount(0.0);
        lowValue.setActive(true);
        lowValue.setPriority(2);
        lowValue.setGstOnFee(false);
        lowValue.setDescription("Reduced fee for orders under ₹500 to encourage small purchases.");
        lowValue.setEstimatedRevenue(0.0);
        repository.save(lowValue);

        MarketplaceFee highValue = new MarketplaceFee();
        highValue.setName("Premium Transaction Fee");
        highValue.setFeeType("TIERED");
        highValue.setFlatAmount(0.0);
        highValue.setPercentage(1.5);
        highValue.setTierData("[{\"minOrder\":2000,\"maxOrder\":5000,\"flatAmount\":20,\"percentage\":0.5},{\"minOrder\":5000,\"maxOrder\":10000,\"flatAmount\":30,\"percentage\":0.8},{\"minOrder\":10000,\"maxOrder\":null,\"flatAmount\":50,\"percentage\":1.0}]");
        highValue.setApplicableCategories("All");
        highValue.setMaxCap(100.0);
        highValue.setMinOrderAmount(2000.0);
        highValue.setActive(false);
        highValue.setPriority(3);
        highValue.setGstOnFee(true);
        highValue.setDescription("Tiered fee for high-value orders. Scales with order value.");
        highValue.setEstimatedRevenue(0.0);
        repository.save(highValue);

        MarketplaceFee electronics = new MarketplaceFee();
        electronics.setName("Electronics Surcharge");
        electronics.setFeeType("FLAT");
        electronics.setFlatAmount(25.0);
        electronics.setPercentage(0.5);
        electronics.setApplicableCategories("Electronics");
        electronics.setMaxCap(75.0);
        electronics.setMinOrderAmount(500.0);
        electronics.setActive(false);
        electronics.setPriority(4);
        electronics.setGstOnFee(true);
        electronics.setDescription("Additional fee for electronics orders due to higher logistics costs.");
        electronics.setEstimatedRevenue(0.0);
        repository.save(electronics);
    }

    public List<MarketplaceFee> getAll() {
        return repository.findAll();
    }

    public List<MarketplaceFee> getActive() {
        return repository.findByActiveTrueOrderByPriorityAsc();
    }

    public Optional<MarketplaceFee> getById(Long id) {
        return repository.findById(id);
    }

    public MarketplaceFee create(MarketplaceFee fee) {
        fee.setId(null);
        fee.setEstimatedRevenue(0.0);
        return repository.save(fee);
    }

    public MarketplaceFee update(Long id, MarketplaceFee updates) {
        MarketplaceFee fee = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Marketplace fee not found: " + id));
        if (updates.getName() != null) fee.setName(updates.getName());
        if (updates.getFeeType() != null) fee.setFeeType(updates.getFeeType());
        if (updates.getFlatAmount() != null) fee.setFlatAmount(updates.getFlatAmount());
        if (updates.getPercentage() != null) fee.setPercentage(updates.getPercentage());
        if (updates.getTierData() != null) fee.setTierData(updates.getTierData());
        if (updates.getApplicableCategories() != null) fee.setApplicableCategories(updates.getApplicableCategories());
        if (updates.getMaxCap() != null) fee.setMaxCap(updates.getMaxCap());
        if (updates.getMinOrderAmount() != null) fee.setMinOrderAmount(updates.getMinOrderAmount());
        if (updates.getActive() != null) fee.setActive(updates.getActive());
        if (updates.getPriority() != null) fee.setPriority(updates.getPriority());
        if (updates.getGstOnFee() != null) fee.setGstOnFee(updates.getGstOnFee());
        if (updates.getDescription() != null) fee.setDescription(updates.getDescription());
        return repository.save(fee);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    /**
     * Calculate total marketplace fee for a given order total and category.
     * Returns a breakdown map: { flatFee, percentageFee, totalFee, appliedRuleName, gstAmount, totalWithGst }
     */
    public Map<String, Object> calculateFee(Double orderTotal, String category) {
        List<MarketplaceFee> activeFees = getActive();
        Map<String, Object> result = new HashMap<>();

        double totalFee = 0;
        String appliedRule = null;
        double gstAmount = 0;

        for (MarketplaceFee fee : activeFees) {
            // Check category applicability
            if (fee.getApplicableCategories() != null && !fee.getApplicableCategories().isEmpty()
                    && !"All".equalsIgnoreCase(fee.getApplicableCategories())) {
                if (category != null && !fee.getApplicableCategories().toLowerCase().contains(category.toLowerCase())) {
                    continue;
                }
            }

            // Check min order amount
            if (fee.getMinOrderAmount() != null && orderTotal < fee.getMinOrderAmount()) {
                continue;
            }

            double feeAmount = 0;

            if ("TIERED".equalsIgnoreCase(fee.getFeeType()) && fee.getTierData() != null) {
                // Parse tier data and find matching tier
                feeAmount = calculateTieredFee(fee, orderTotal);
            } else {
                // Flat fee
                feeAmount = fee.getFlatAmount() != null ? fee.getFlatAmount() : 0;
                if (fee.getPercentage() != null && fee.getPercentage() > 0) {
                    feeAmount += orderTotal * (fee.getPercentage() / 100.0);
                }
            }

            // Apply max cap
            if (fee.getMaxCap() != null && fee.getMaxCap() > 0 && feeAmount > fee.getMaxCap()) {
                feeAmount = fee.getMaxCap();
            }

            totalFee += feeAmount;
            appliedRule = fee.getName();

            // GST on fee
            if (Boolean.TRUE.equals(fee.getGstOnFee())) {
                gstAmount += feeAmount * 0.18; // 18% GST on platform fee
            }
        }

        result.put("flatFee", Math.round(totalFee * 100.0) / 100.0);
        result.put("percentageFee", 0.0);
        result.put("totalFee", Math.round(totalFee * 100.0) / 100.0);
        result.put("appliedRuleName", appliedRule);
        result.put("gstAmount", Math.round(gstAmount * 100.0) / 100.0);
        result.put("totalWithGst", Math.round((totalFee + gstAmount) * 100.0) / 100.0);
        return result;
    }

    @SuppressWarnings("unchecked")
    private double calculateTieredFee(MarketplaceFee fee, Double orderTotal) {
        try {
            String tierData = fee.getTierData();
            if (tierData == null || tierData.isEmpty()) return 0;

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            List<Map<String, Object>> tiers = mapper.readValue(tierData, List.class);

            for (Map<String, Object> tier : tiers) {
                Double minOrder = tier.get("minOrder") != null ? ((Number) tier.get("minOrder")).doubleValue() : 0.0;
                Double maxOrder = tier.get("maxOrder") != null ? ((Number) tier.get("maxOrder")).doubleValue() : Double.MAX_VALUE;

                if (orderTotal >= minOrder && orderTotal < maxOrder) {
                    double flat = tier.get("flatAmount") != null ? ((Number) tier.get("flatAmount")).doubleValue() : 0;
                    double pct = tier.get("percentage") != null ? ((Number) tier.get("percentage")).doubleValue() : 0;
                    return flat + (orderTotal * pct / 100.0);
                }
            }
        } catch (Exception e) {
            // Fallback to flat fee if tier parsing fails
            return fee.getFlatAmount() != null ? fee.getFlatAmount() : 0;
        }
        return 0;
    }

    public Map<String, Object> getStats() {
        List<MarketplaceFee> all = repository.findAll();
        Map<String, Object> stats = new HashMap<>();
        long activeCount = all.stream().filter(f -> Boolean.TRUE.equals(f.getActive())).count();
        double totalRevenue = all.stream()
                .mapToDouble(f -> f.getEstimatedRevenue() != null ? f.getEstimatedRevenue() : 0)
                .sum();
        stats.put("totalRules", all.size());
        stats.put("activeRules", activeCount);
        stats.put("inactiveRules", all.size() - activeCount);
        stats.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        return stats;
    }
}
