package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.model.VendorFollow;
import com.sreemarket.backend.repository.VendorFollowRepository;
import com.sreemarket.backend.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class VendorFollowService {

    @Autowired
    private VendorFollowRepository vendorFollowRepository;

    @Autowired
    private VendorRepository vendorRepository;

    public VendorFollow follow(Long userId, Long vendorId) {
        if (vendorFollowRepository.existsByUserIdAndVendorId(userId, vendorId)) {
            throw new RuntimeException("Already following this vendor");
        }
        if (!vendorRepository.existsById(vendorId)) {
            throw new RuntimeException("Vendor not found");
        }
        VendorFollow follow = new VendorFollow();
        follow.setUserId(userId);
        follow.setVendorId(vendorId);
        return vendorFollowRepository.save(follow);
    }

    public void unfollow(Long userId, Long vendorId) {
        if (!vendorFollowRepository.existsByUserIdAndVendorId(userId, vendorId)) {
            throw new RuntimeException("Not following this vendor");
        }
        vendorFollowRepository.deleteByUserIdAndVendorId(userId, vendorId);
    }

    public List<Map<String, Object>> getFollowedVendors(Long userId) {
        List<VendorFollow> follows = vendorFollowRepository.findByUserId(userId);
        return follows.stream().map(f -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("vendorId", f.getVendorId());
            map.put("createdAt", f.getCreatedAt());
            Optional<Vendor> vendor = vendorRepository.findById(f.getVendorId());
            if (vendor.isPresent()) {
                Vendor v = vendor.get();
                map.put("vendorName", v.getFullName());
                map.put("vendorEmail", v.getEmail());
                map.put("vendorRating", v.getRating());
                map.put("vendorStatus", v.getStatus());
            }
            return map;
        }).collect(Collectors.toList());
    }

    public boolean isFollowing(Long userId, Long vendorId) {
        return vendorFollowRepository.existsByUserIdAndVendorId(userId, vendorId);
    }

    public long getFollowerCount(Long vendorId) {
        return vendorFollowRepository.countByVendorId(vendorId);
    }

    public Map<String, Object> getVendorFollowStats(Long vendorId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("followerCount", vendorFollowRepository.countByVendorId(vendorId));
        return stats;
    }
}
