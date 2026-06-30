package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Currency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CurrencyRepository extends JpaRepository<Currency, Long> {
    Optional<Currency> findByCode(String code);
    List<Currency> findByIsActiveTrue();
    Optional<Currency> findByIsDefaultTrue();
    boolean existsByCode(String code);
}
