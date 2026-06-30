package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Wholesaler;
import com.sreemarket.backend.repository.WholesalerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WholesalerService {

    @Autowired
    private WholesalerRepository wholesalerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public Wholesaler registerWholesaler(Wholesaler wholesaler) {
        if (wholesalerRepository.existsByEmail(wholesaler.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        if (wholesalerRepository.existsByPhone(wholesaler.getPhone())) {
            throw new RuntimeException("Phone number already in use");
        }

        if (wholesaler.getPassword() != null) {
            wholesaler.setPassword(passwordEncoder.encode(wholesaler.getPassword()));
        }

        wholesaler.setRoleId(4L);
        wholesaler.setStatus("Pending");
        wholesaler.setCreatedAt(System.currentTimeMillis());
        wholesaler.setUpdatedAt(System.currentTimeMillis());

        Wholesaler saved = wholesalerRepository.save(wholesaler);
        return saved;
    }

    public Wholesaler loginWholesaler(String email, String password) {
        Wholesaler wholesaler = wholesalerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Wholesaler account not found"));

        if (!passwordEncoder.matches(password, wholesaler.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        if ("Pending".equalsIgnoreCase(wholesaler.getStatus())) {
            throw new RuntimeException("Your wholesaler account is pending approval.");
        }

        if ("Suspended".equalsIgnoreCase(wholesaler.getStatus())) {
            throw new RuntimeException("Your wholesaler account has been suspended. Please contact administrator.");
        }

        if ("Rejected".equalsIgnoreCase(wholesaler.getStatus())) {
            throw new RuntimeException("Your wholesaler application has been rejected.");
        }

        return wholesaler;
    }

    @Transactional(readOnly = true)
    public Wholesaler getWholesalerById(Long id) {
        return wholesalerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wholesaler not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public Page<Wholesaler> listWholesalers(String search, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (search != null && !search.trim().isEmpty()) {
            return wholesalerRepository.searchWholesalers(search, status, pageable);
        }
        if (status != null && !status.trim().isEmpty()) {
            return wholesalerRepository.findByStatus(status, pageable);
        }
        return wholesalerRepository.findAll(pageable);
    }

    @Transactional
    public Wholesaler updateWholesalerStatus(Long id, String status) {
        Wholesaler wholesaler = getWholesalerById(id);
        wholesaler.setStatus(status);
        wholesaler.setUpdatedAt(System.currentTimeMillis());
        return wholesalerRepository.save(wholesaler);
    }

    @Transactional
    public Wholesaler updateWholesaler(Long id, Wholesaler updated) {
        Wholesaler wholesaler = getWholesalerById(id);
        if (updated.getFullName() != null) wholesaler.setFullName(updated.getFullName());
        if (updated.getEmail() != null) wholesaler.setEmail(updated.getEmail());
        if (updated.getPhone() != null) wholesaler.setPhone(updated.getPhone());
        if (updated.getBusinessName() != null) wholesaler.setBusinessName(updated.getBusinessName());
        if (updated.getGstNumber() != null) wholesaler.setGstNumber(updated.getGstNumber());
        if (updated.getBusinessAddress() != null) wholesaler.setBusinessAddress(updated.getBusinessAddress());
        if (updated.getBusinessPhone() != null) wholesaler.setBusinessPhone(updated.getBusinessPhone());
        if (updated.getBusinessType() != null) wholesaler.setBusinessType(updated.getBusinessType());
        if (updated.getMinMonthlyOrderValue() != null) wholesaler.setMinMonthlyOrderValue(updated.getMinMonthlyOrderValue());
        wholesaler.setUpdatedAt(System.currentTimeMillis());
        return wholesalerRepository.save(wholesaler);
    }
}
