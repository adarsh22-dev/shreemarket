package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.PaymentGatewayLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentGatewayLogRepository extends JpaRepository<PaymentGatewayLog, Long> {
    Page<PaymentGatewayLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<PaymentGatewayLog> findByGatewayOrderByCreatedAtDesc(String gateway, Pageable pageable);
    Page<PaymentGatewayLog> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<PaymentGatewayLog> findByTypeOrderByCreatedAtDesc(String type, Pageable pageable);
    Page<PaymentGatewayLog> findByTransactionIdContainingIgnoreCaseOrVendorNameContainingIgnoreCaseOrReferenceContainingIgnoreCase(
            String transactionId, String vendorName, String reference, Pageable pageable);
}
