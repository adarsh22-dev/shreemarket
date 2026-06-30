package com.sreemarket.backend.service;

import com.sreemarket.backend.model.VendorActivity;
import com.sreemarket.backend.repository.VendorActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class VendorActivityService {

    @Autowired
    private VendorActivityRepository vendorActivityRepository;

    public VendorActivity logActivity(Long vendorId, String vendorName, String action, String details, String ipAddress) {
        VendorActivity activity = new VendorActivity(vendorId, vendorName, action, details, ipAddress);
        return vendorActivityRepository.save(activity);
    }

    public Page<VendorActivity> getActivities(int page, int size, String search) {
        Sort sort = Sort.by(Sort.Direction.DESC, "timestamp");
        Pageable pageable = PageRequest.of(page, size, sort);

        if (search != null && !search.trim().isEmpty()) {
            return vendorActivityRepository
                    .findByActionContainingIgnoreCaseOrVendorNameContainingIgnoreCaseOrDetailsContainingIgnoreCase(
                            search, search, search, pageable);
        }
        return vendorActivityRepository.findAllByOrderByTimestampDesc(pageable);
    }

    public Page<VendorActivity> getVendorActivities(Long vendorId, int page, int size) {
        Sort sort = Sort.by(Sort.Direction.DESC, "timestamp");
        Pageable pageable = PageRequest.of(page, size, sort);
        return vendorActivityRepository.findByVendorIdOrderByTimestampDesc(vendorId, pageable);
    }
}
