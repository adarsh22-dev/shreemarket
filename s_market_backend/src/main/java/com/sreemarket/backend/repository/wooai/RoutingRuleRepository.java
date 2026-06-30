package com.sreemarket.backend.repository.wooai;

import com.sreemarket.backend.model.wooai.RoutingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoutingRuleRepository extends JpaRepository<RoutingRule, Long> {
    List<RoutingRule> findByActiveTrue();
}
