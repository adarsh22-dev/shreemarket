package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Optional<Vendor> findByEmail(String email);

    Optional<Vendor> findByResetToken(String resetToken);

    Page<Vendor> findByStatus(String status, Pageable pageable);

    @Query("SELECT DISTINCT v FROM Vendor v LEFT JOIN v.stores s WHERE " +
            "v.status = :status AND (" +
            "LOWER(v.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(s.storeName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(s.city) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Vendor> searchVendorsByStatus(@Param("search") String search, @Param("status") String status,
            Pageable pageable);

    @Query("SELECT DISTINCT v FROM Vendor v LEFT JOIN v.stores s WHERE " +
            "LOWER(v.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(s.storeName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(s.city) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Vendor> searchVendors(@Param("search") String search, Pageable pageable);

    // Soft-delete queries
    List<Vendor> findByDeletedTrue();
    List<Vendor> findByDeletedTrueAndFullNameContainingIgnoreCase(String name);
    long countByDeletedTrue();
    List<Vendor> findAllByDeletedTrueAndDeletedAtLessThan(Long deletedAt);
}
