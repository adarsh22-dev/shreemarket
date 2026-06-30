package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    Page<AuditLog> findBySeverityOrderByTimestampDesc(String severity, Pageable pageable);
    Page<AuditLog> findByActionContainingIgnoreCaseOrAdminNameContainingIgnoreCase(
            String action, String adminName, Pageable pageable);
    Page<AuditLog> findBySeverityAndActionContainingIgnoreCaseOrAdminNameContainingIgnoreCase(
            String severity, String action, String adminName, Pageable pageable);
}
