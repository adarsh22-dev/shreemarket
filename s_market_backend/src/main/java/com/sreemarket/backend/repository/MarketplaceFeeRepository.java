package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.MarketplaceFee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MarketplaceFeeRepository extends JpaRepository<MarketplaceFee, Long> {
    List<MarketplaceFee> findByActiveTrue();
    List<MarketplaceFee> findByActiveTrueOrderByPriorityAsc();
}
