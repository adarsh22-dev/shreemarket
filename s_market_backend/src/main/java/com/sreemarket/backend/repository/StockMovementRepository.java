package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByVendorIdOrderByCreatedAtDesc(Long vendorId);

    Page<StockMovement> findByVendorIdOrderByCreatedAtDesc(Long vendorId, Pageable pageable);

    List<StockMovement> findByProductIdOrderByCreatedAtDesc(Long productId);

    List<StockMovement> findByVendorIdAndTypeOrderByCreatedAtDesc(Long vendorId, String type);

    List<StockMovement> findByVendorIdAndProductIdOrderByCreatedAtDesc(Long vendorId, Long productId);

    @Query("SELECT s FROM StockMovement s WHERE s.vendorId = :vendorId " +
           "AND (:productId IS NULL OR s.productId = :productId) " +
           "AND (:type IS NULL OR s.type = :type) " +
           "AND (:startDate IS NULL OR s.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR s.createdAt <= :endDate) " +
           "ORDER BY s.createdAt DESC")
    Page<StockMovement> findByFilters(@Param("vendorId") Long vendorId,
                                      @Param("productId") Long productId,
                                      @Param("type") String type,
                                      @Param("startDate") Long startDate,
                                      @Param("endDate") Long endDate,
                                      Pageable pageable);

    @Query("SELECT s FROM StockMovement s WHERE s.vendorId = :vendorId " +
           "AND (LOWER(s.productName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.productSku) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.reference) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY s.createdAt DESC")
    Page<StockMovement> searchByVendor(@Param("vendorId") Long vendorId,
                                       @Param("search") String search,
                                       Pageable pageable);

    long countByVendorIdAndType(Long vendorId, String type);
}
