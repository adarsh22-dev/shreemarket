package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaxRateRepository extends JpaRepository<TaxRate, Long> {
    List<TaxRate> findByStatus(String status);
    List<TaxRate> findByIsDefaultTrue();
}
