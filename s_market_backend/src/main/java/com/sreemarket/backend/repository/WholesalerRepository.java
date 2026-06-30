package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Wholesaler;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WholesalerRepository extends JpaRepository<Wholesaler, Long> {

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Optional<Wholesaler> findByEmail(String email);

    Page<Wholesaler> findByStatus(String status, Pageable pageable);

    @Query("SELECT w FROM Wholesaler w WHERE " +
            "(:search IS NULL OR " +
            "LOWER(w.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(w.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(w.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(w.businessName) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
            "(:status IS NULL OR w.status = :status)")
    Page<Wholesaler> searchWholesalers(@Param("search") String search, @Param("status") String status, Pageable pageable);
}
