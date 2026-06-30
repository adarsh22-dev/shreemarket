package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.RecentlyViewed;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecentlyViewedRepository extends JpaRepository<RecentlyViewed, Long> {
    List<RecentlyViewed> findByUserIdOrderByViewedAtDesc(Long userId);
    void deleteByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserId(Long userId);
}
