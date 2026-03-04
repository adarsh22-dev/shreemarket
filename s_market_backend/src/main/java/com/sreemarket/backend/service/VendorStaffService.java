package com.sreemarket.backend.service;

import com.sreemarket.backend.model.VendorStaff;
import com.sreemarket.backend.repository.VendorStaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class VendorStaffService {

    @Autowired
    private VendorStaffRepository repository;

    public List<VendorStaff> getStaffByVendorId(Long vendorId) {
        return repository.findByVendorId(vendorId);
    }

    public VendorStaff getStaffById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public VendorStaff createStaff(VendorStaff staff) {
        if (staff.getCreatedAt() == null) {
            staff.setCreatedAt(Instant.now().toString());
        }
        if (staff.getActive() == null) {
            staff.setActive(true);
        }
        return repository.save(staff);
    }

    public VendorStaff updateStaff(Long id, VendorStaff details) {
        Optional<VendorStaff> optional = repository.findById(id);
        if (optional.isPresent()) {
            VendorStaff existing = optional.get();
            if (details.getUsername() != null)
                existing.setUsername(details.getUsername());
            if (details.getPassword() != null)
                existing.setPassword(details.getPassword());
            if (details.getLabel() != null)
                existing.setLabel(details.getLabel());
            if (details.getAccessToken() != null)
                existing.setAccessToken(details.getAccessToken());
            if (details.getActive() != null)
                existing.setActive(details.getActive());
            return repository.save(existing);
        }
        return null;
    }

    public void deleteStaff(Long id) {
        repository.deleteById(id);
    }
}
