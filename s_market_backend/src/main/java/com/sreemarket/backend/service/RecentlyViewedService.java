package com.sreemarket.backend.service;

import com.sreemarket.backend.model.RecentlyViewed;
import com.sreemarket.backend.repository.RecentlyViewedRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RecentlyViewedService {

    private final RecentlyViewedRepository repository;

    public RecentlyViewedService(RecentlyViewedRepository repository) {
        this.repository = repository;
    }

    public List<RecentlyViewed> getRecentlyViewed(Long userId) {
        return repository.findByUserIdOrderByViewedAtDesc(userId);
    }

    public RecentlyViewed trackView(Long userId, Long productId, String productName, String productImage, Double productPrice) {
        repository.deleteByUserIdAndProductId(userId, productId);
        RecentlyViewed rv = new RecentlyViewed();
        rv.setUserId(userId);
        rv.setProductId(productId);
        rv.setProductName(productName);
        rv.setProductImage(productImage);
        rv.setProductPrice(productPrice);
        rv.setViewedAt(System.currentTimeMillis());
        RecentlyViewed saved = repository.save(rv);
        List<RecentlyViewed> all = repository.findByUserIdOrderByViewedAtDesc(userId);
        if (all.size() > 20) {
            for (int i = 20; i < all.size(); i++) {
                repository.delete(all.get(i));
            }
        }
        return saved;
    }

    public void clearHistory(Long userId) {
        repository.deleteByUserId(userId);
    }
}
