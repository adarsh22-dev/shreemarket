package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Optional<Vendor> findByEmail(String email);

    Page<Vendor> findByStatus(String status, Pageable pageable);

    @Query("SELECT v FROM Vendor v WHERE " +
            "v.status = :status AND (" +
            "LOWER(v.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Vendor> searchVendorsByStatus(@Param("search") String search, @Param("status") String status,
            Pageable pageable);

    @Query("SELECT v FROM Vendor v WHERE " +
            "LOWER(v.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Vendor> searchVendors(@Param("search") String search, Pageable pageable);
}
