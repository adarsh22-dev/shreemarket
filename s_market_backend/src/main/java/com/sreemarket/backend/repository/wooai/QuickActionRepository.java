package com.sreemarket.backend.repository.wooai;

import com.sreemarket.backend.model.wooai.QuickAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuickActionRepository extends JpaRepository<QuickAction, Long> {
    List<QuickAction> findByActiveTrue();
}
