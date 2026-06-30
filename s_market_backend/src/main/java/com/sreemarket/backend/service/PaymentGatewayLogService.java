package com.sreemarket.backend.service;

import com.sreemarket.backend.model.PaymentGatewayLog;
import com.sreemarket.backend.repository.PaymentGatewayLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class PaymentGatewayLogService {

    @Autowired
    private PaymentGatewayLogRepository repository;

    public Page<PaymentGatewayLog> getAll(int page, int size, String search, String gateway, String type, String status) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        if (search != null && !search.trim().isEmpty()) {
            return repository
                    .findByTransactionIdContainingIgnoreCaseOrVendorNameContainingIgnoreCaseOrReferenceContainingIgnoreCase(
                            search, search, search, pageable);
        }
        if (gateway != null && !gateway.isEmpty()) {
            return repository.findByGatewayOrderByCreatedAtDesc(gateway, pageable);
        }
        if (type != null && !type.isEmpty()) {
            return repository.findByTypeOrderByCreatedAtDesc(type, pageable);
        }
        if (status != null && !status.isEmpty()) {
            return repository.findByStatusOrderByCreatedAtDesc(status, pageable);
        }
        return repository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public PaymentGatewayLog save(PaymentGatewayLog log) {
        return repository.save(log);
    }
}
