package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Referrer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReferrerRepository extends JpaRepository<Referrer, Long> {
    Optional<Referrer> findByUserId(Long userId);
    Optional<Referrer> findByCode(String code);
}
