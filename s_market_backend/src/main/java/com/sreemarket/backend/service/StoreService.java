package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Store;
import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.repository.StoreRepository;
import com.sreemarket.backend.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StoreService {

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private VendorRepository vendorRepository;

    public List<Store> getStoresByVendorId(Long vendorId) {
        return storeRepository.findByVendorId(vendorId);
    }

    @Transactional
    public Store createStore(Long vendorId, Store store) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        store.setVendor(vendor);
        return storeRepository.save(store);
    }

    @Transactional
    public Store updateStore(Long vendorId, Long storeId, Store update) {
        Store existing = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found"));
        if (!existing.getVendor().getId().equals(vendorId)) {
            throw new RuntimeException("Store does not belong to this vendor");
        }
        if (update.getStoreName() != null) existing.setStoreName(update.getStoreName());
        if (update.getDescription() != null) existing.setDescription(update.getDescription());
        if (update.getCity() != null) existing.setCity(update.getCity());
        if (update.getState() != null) existing.setState(update.getState());
        if (update.getCountry() != null) existing.setCountry(update.getCountry());
        if (update.getPincode() != null) existing.setPincode(update.getPincode());
        if (update.getPhoneNumber() != null) existing.setPhoneNumber(update.getPhoneNumber());
        if (update.getEmailAddress() != null) existing.setEmailAddress(update.getEmailAddress());
        if (update.getFullAddress() != null) existing.setFullAddress(update.getFullAddress());
        if (update.getStoreLogo() != null) existing.setStoreLogo(update.getStoreLogo());
        return storeRepository.save(existing);
    }

    @Transactional
    public void deleteStore(Long vendorId, Long storeId) {
        Store existing = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found"));
        if (!existing.getVendor().getId().equals(vendorId)) {
            throw new RuntimeException("Store does not belong to this vendor");
        }
        storeRepository.deleteById(storeId);
    }
}
