package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class VendorService {

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Vendor getVendorById(Long id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));
    }

    public Vendor registerVendor(Vendor vendor) {
        System.out.println("Registering vendor: " + vendor.getFullName() + " with " +
                (vendor.getStores() != null ? vendor.getStores().size() : 0) + " stores.");

        if (vendorRepository.existsByEmail(vendor.getEmail())) {
            throw new RuntimeException("Email already in use by another vendor");
        }

        if (vendorRepository.existsByPhone(vendor.getPhone())) {
            throw new RuntimeException("Phone number already in use by another vendor");
        }

        if (vendor.getPassword() != null) {
            vendor.setPassword(passwordEncoder.encode(vendor.getPassword()));
        }

        if (vendor.getRoleId() == null) {
            vendor.setRoleId(3L); // Default Vendor Role ID
        }

        if (vendor.getStatus() == null) {
            vendor.setStatus("Pending");
        }

        vendor.setCreatedAt(System.currentTimeMillis());

        // Map stores to this vendor explicitly to ensure vendor_id is saved
        if (vendor.getStores() != null && !vendor.getStores().isEmpty()) {
            vendor.getStores().forEach(store -> store.setVendor(vendor));
        }

        return vendorRepository.save(vendor);
    }

    public Page<Vendor> getVendors(String search, String status, int page, int size, String sortDir, String sortBy) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        if (status != null && !status.trim().isEmpty()) {
            if (search != null && !search.trim().isEmpty()) {
                return vendorRepository.searchVendorsByStatus(search, status, pageable);
            } else {
                return vendorRepository.findByStatus(status, pageable);
            }
        } else {
            if (search != null && !search.trim().isEmpty()) {
                return vendorRepository.searchVendors(search, pageable);
            } else {
                return vendorRepository.findAll(pageable);
            }
        }
    }

    public Vendor updateVendorStatus(Long id, String status) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));
        vendor.setStatus(status);
        vendor.setUpdatedAt(System.currentTimeMillis());
        return vendorRepository.save(vendor);
    }

    public void deleteVendor(Long id) {
        if (!vendorRepository.existsById(id)) {
            throw new RuntimeException("Vendor not found with id: " + id);
        }
        vendorRepository.deleteById(id);
    }
}
