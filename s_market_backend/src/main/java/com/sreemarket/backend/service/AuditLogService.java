package com.sreemarket.backend.service;

import com.sreemarket.backend.model.AuditLog;
import com.sreemarket.backend.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public AuditLog logActivity(Long adminId, String adminName, String action, String module,
                                 String ipAddress, String severity, String details) {
        AuditLog log = new AuditLog(adminId, adminName, action, module, ipAddress, severity, details);
        return auditLogRepository.save(log);
    }

    public Page<AuditLog> getAuditLogs(int page, int size, String search, String severity) {
        Sort sort = Sort.by(Sort.Direction.DESC, "timestamp");
        Pageable pageable = PageRequest.of(page, size, sort);

        boolean hasSearch = search != null && !search.trim().isEmpty();
        boolean hasSeverity = severity != null && !severity.trim().isEmpty()
                && !"All".equalsIgnoreCase(severity);

        if (hasSearch && hasSeverity) {
            return auditLogRepository
                    .findBySeverityAndActionContainingIgnoreCaseOrAdminNameContainingIgnoreCase(
                            severity, search, search, pageable);
        } else if (hasSearch) {
            return auditLogRepository
                    .findByActionContainingIgnoreCaseOrAdminNameContainingIgnoreCase(
                            search, search, pageable);
        } else if (hasSeverity) {
            return auditLogRepository.findBySeverityOrderByTimestampDesc(severity, pageable);
        }
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
}
