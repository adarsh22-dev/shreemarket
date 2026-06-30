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
import org.springframework.transaction.annotation.Transactional;

@Service
public class VendorService {

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private VendorActivityService vendorActivityService;

    @Transactional(readOnly = true)
    public Vendor getVendorById(Long id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));
        // Initialize lazy collections within the active transaction
        if (vendor.getStores() != null) {
            vendor.getStores().size();
        }
        return vendor;
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

        Vendor savedVendor = vendorRepository.save(vendor);

        // Log vendor registration activity
        try {
            vendorActivityService.logActivity(savedVendor.getId(), savedVendor.getFullName(),
                    "vendor_registered",
                    "Vendor registered with email: " + savedVendor.getEmail(),
                    null);
        } catch (Exception ignored) {}

        return savedVendor;
    }

    @Transactional(readOnly = true)
    public Page<Vendor> getVendors(String search, String status, int page, int size, String sortDir, String sortBy) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Vendor> result;
        if (status != null && !status.trim().isEmpty()) {
            if (search != null && !search.trim().isEmpty()) {
                result = vendorRepository.searchVendorsByStatus(search, status, pageable);
            } else {
                result = vendorRepository.findByStatus(status, pageable);
            }
        } else {
            if (search != null && !search.trim().isEmpty()) {
                result = vendorRepository.searchVendors(search, pageable);
            } else {
                result = vendorRepository.findAll(pageable);
            }
        }

        // Initialize lazy collections within the active transaction
        result.getContent().forEach(v -> {
            if (v.getStores() != null) {
                v.getStores().size();
            }
        });

        return result;
    }

    public Vendor updateVendorStatus(Long id, String status) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));
        vendor.setStatus(status);
        vendor.setUpdatedAt(System.currentTimeMillis());
        Vendor updated = vendorRepository.save(vendor);

        try {
            vendorActivityService.logActivity(id, vendor.getFullName(),
                    "vendor_status_changed",
                    "Status changed from " + vendor.getStatus() + " to " + status,
                    null);
        } catch (Exception ignored) {}

        return updated;
    }

    public void deleteVendor(Long id, String password) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));

        if (!passwordEncoder.matches(password, vendor.getPassword())) {
            throw new RuntimeException("Invalid password. Deletion denied.");
        }

        vendorRepository.deleteById(id);
    }

    @Transactional
    public Vendor updateVendor(Long id, Vendor updated) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));
        if (updated.getFullName() != null) vendor.setFullName(updated.getFullName());
        if (updated.getEmail() != null) vendor.setEmail(updated.getEmail());
        if (updated.getPhone() != null) vendor.setPhone(updated.getPhone());
        if (updated.getStatus() != null) vendor.setStatus(updated.getStatus());
        if (updated.getPaymentMethod() != null) vendor.setPaymentMethod(updated.getPaymentMethod());
        if (updated.getPaymentEmail() != null) vendor.setPaymentEmail(updated.getPaymentEmail());
        if (updated.getRating() != null) vendor.setRating(updated.getRating());
        if (updated.getTier() != null) vendor.setTier(updated.getTier());
        if (updated.getKycStatus() != null) vendor.setKycStatus(updated.getKycStatus());
        if (updated.getCommissionRate() != null) vendor.setCommissionRate(updated.getCommissionRate());
        if (updated.getOrderCount() != null) vendor.setOrderCount(updated.getOrderCount());
        if (updated.getTotalRevenue() != null) vendor.setTotalRevenue(updated.getTotalRevenue());
        if (updated.getPan() != null) vendor.setPan(updated.getPan());
        if (updated.getGst() != null) vendor.setGst(updated.getGst());
        if (updated.getAgreeTerms() != null) vendor.setAgreeTerms(updated.getAgreeTerms());
        if (updated.getAgreePolicies() != null) vendor.setAgreePolicies(updated.getAgreePolicies());
        if (updated.getAgreeRules() != null) vendor.setAgreeRules(updated.getAgreeRules());
        if (updated.getAgreePrivacy() != null) vendor.setAgreePrivacy(updated.getAgreePrivacy());
        if (updated.getNewsletter() != null) vendor.setNewsletter(updated.getNewsletter());
        vendor.setUpdatedAt(System.currentTimeMillis());

        // Update stores if provided
        if (updated.getStores() != null && !updated.getStores().isEmpty()) {
            vendor.getStores().clear();
            updated.getStores().forEach(store -> {
                store.setVendor(vendor);
                vendor.getStores().add(store);
            });
        }

        return vendorRepository.save(vendor);
    }

    public void changePassword(Long vendorId, String currentPassword, String newPassword) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        if (!passwordEncoder.matches(currentPassword, vendor.getPassword())) {
            throw new RuntimeException("Invalid current password");
        }

        vendor.setPassword(passwordEncoder.encode(newPassword));
        vendorRepository.save(vendor);
    }

    /**
     * Validates that the vendor exists and is approved.
     * Throws RuntimeException if vendor is not approved.
     * Vendors with status "Pending" or "Suspended" are not allowed to add products.
     * @param vendorId the vendor ID to check
     * @throws RuntimeException if vendor is not found or not approved
     */
    public void ensureVendorIsApproved(Long vendorId) {
        if (vendorId == null) {
            throw new VendorNotApprovedException("Vendor ID is required");
        }
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new VendorNotApprovedException("Vendor not found with id: " + vendorId));

        // Vendors with Pending or Suspended status are not allowed to add products
        if ("Pending".equalsIgnoreCase(vendor.getStatus())) {
            throw new VendorNotApprovedException("Vendor account is pending approval. Please wait for admin approval before adding products.");
        }
        if ("Suspended".equalsIgnoreCase(vendor.getStatus())) {
            throw new VendorNotApprovedException("Vendor account is suspended. You are not allowed to add products.");
        }
        // Accept both "Approved" and "Active" as valid approved statuses
        if (!"Approved".equalsIgnoreCase(vendor.getStatus()) && !"Active".equalsIgnoreCase(vendor.getStatus())) {
            throw new VendorNotApprovedException("Vendor is not approved. Current status: " + vendor.getStatus());
        }
    }

    public String getStoreDetails(Long vendorId) {
        Vendor vendor = getVendorById(vendorId);
        return vendor.getSettings();
    }

    public void saveStoreDetails(Long vendorId, String settingsJson) {
        Vendor vendor = getVendorById(vendorId);
        vendor.setSettings(settingsJson);
        vendorRepository.save(vendor);
    }

    /**
     * Exception thrown when a vendor is not approved to perform an action.
     */
    public static class VendorNotApprovedException extends RuntimeException {
        public VendorNotApprovedException(String message) {
            super(message);
        }
    }
}
