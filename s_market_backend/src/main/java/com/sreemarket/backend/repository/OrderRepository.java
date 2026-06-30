package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByDatePlacedDesc(Long userId);

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByVendorIdOrderByDatePlacedDesc(Long vendorId);

    // Admin queries
    @Query("SELECT SUM(o.totalAmount) FROM Order o")
    Double sumTotalAmount();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.datePlaced >= :since")
    long countByDatePlacedAfter(@Param("since") long since);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.datePlaced >= :since")
    Double sumTotalAmountAfter(@Param("since") long since);

    long countByStatus(String status);

    List<Order> findByDatePlacedAfterOrderByDatePlacedAsc(long since);

    List<Order> findTop5ByOrderByDatePlacedDesc();

    Page<Order> findByStatus(String status, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE " +
            "LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
            "LOWER(o.customerName) LIKE LOWER(CONCAT('%', :term, '%'))")
    Page<Order> searchByTerm(@Param("term") String term, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.status = :status AND (" +
            "LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
            "LOWER(o.customerName) LIKE LOWER(CONCAT('%', :term, '%')))")
    Page<Order> searchByStatusAndTerm(@Param("status") String status,
            @Param("term") String term, Pageable pageable);

    List<Order> findByVendorIdAndStatus(Long vendorId, String status);
}
