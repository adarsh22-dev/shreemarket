package com.sreemarket.backend.repository.wooai;

import com.sreemarket.backend.model.wooai.Policy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PolicyRepository extends JpaRepository<Policy, Long> {
    List<Policy> findByActiveTrue();
    List<Policy> findByCategory(String category);
}
