package com.sreemarket.backend.service;

import com.sreemarket.backend.model.CompetitorPrice;
import com.sreemarket.backend.repository.CompetitorPriceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CompetitorPriceService {

    @Autowired
    private CompetitorPriceRepository competitorPriceRepository;

    public List<CompetitorPrice> getCompetitorPrices(Long productId) {
        return competitorPriceRepository.findByProductId(productId);
    }

    public CompetitorPrice addCompetitorPrice(CompetitorPrice price) {
        price.setLastChecked(System.currentTimeMillis());
        return competitorPriceRepository.save(price);
    }

    public CompetitorPrice updateCompetitorPrice(Long id, CompetitorPrice updated) {
        CompetitorPrice existing = competitorPriceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competitor price not found: " + id));
        if (updated.getPrice() != null) existing.setPrice(updated.getPrice());
        if (updated.getCompetitorName() != null) existing.setCompetitorName(updated.getCompetitorName());
        if (updated.getProductUrl() != null) existing.setProductUrl(updated.getProductUrl());
        if (updated.getInStock() != null) existing.setInStock(updated.getInStock());
        if (updated.getNotes() != null) existing.setNotes(updated.getNotes());
        existing.setLastChecked(System.currentTimeMillis());
        return competitorPriceRepository.save(existing);
    }

    public void deleteCompetitorPrice(Long id) {
        competitorPriceRepository.deleteById(id);
    }

    public Map<String, Object> getPriceComparison(Long productId, Double ourPrice) {
        List<CompetitorPrice> competitors = competitorPriceRepository.findByProductId(productId);
        Map<String, Object> result = new HashMap<>();
        result.put("productId", productId);
        result.put("ourPrice", ourPrice);

        double lowestPrice = ourPrice != null ? ourPrice : Double.MAX_VALUE;
        String lowestCompetitor = "Us";
        double highestPrice = ourPrice != null ? ourPrice : 0;
        double totalCompetitorPrice = 0;
        int count = 0;

        for (CompetitorPrice cp : competitors) {
            if (cp.getPrice() != null && cp.getInStock()) {
                if (cp.getPrice() < lowestPrice) {
                    lowestPrice = cp.getPrice();
                    lowestCompetitor = cp.getCompetitorName();
                }
                if (cp.getPrice() > highestPrice) {
                    highestPrice = cp.getPrice();
                }
                totalCompetitorPrice += cp.getPrice();
                count++;
            }
        }

        double avgCompetitorPrice = count > 0 ? totalCompetitorPrice / count : 0;
        double priceAdvantage = ourPrice != null && avgCompetitorPrice > 0
                ? ((avgCompetitorPrice - ourPrice) / avgCompetitorPrice) * 100 : 0;

        result.put("competitorCount", count);
        result.put("lowestPrice", lowestPrice);
        result.put("lowestCompetitor", lowestCompetitor);
        result.put("highestPrice", highestPrice);
        result.put("averageCompetitorPrice", avgCompetitorPrice);
        result.put("ourPriceAdvantage", Math.round(priceAdvantage * 100.0) / 100.0);
        result.put("competitors", competitors);

        if (ourPrice != null) {
            result.put("weAreCheapest", lowestCompetitor.equals("Us"));
            result.put("priceDifference", ourPrice - lowestPrice);
        }

        return result;
    }
}
