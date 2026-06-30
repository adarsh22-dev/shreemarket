package com.sreemarket.backend.service;

import com.sreemarket.backend.model.ProductBundle;
import com.sreemarket.backend.repository.ProductBundleRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProductBundleService {

    private final ProductBundleRepository repository;

    public ProductBundleService(ProductBundleRepository repository) {
        this.repository = repository;
    }

    public List<ProductBundle> getAllBundles() {
        return repository.findAll();
    }

    public List<ProductBundle> getActiveBundles() {
        return repository.findByStatus("ACTIVE");
    }

    public List<ProductBundle> getVendorBundles(Long vendorId) {
        return repository.findByVendorId(vendorId);
    }

    public ProductBundle getBundle(Long id) {
        return repository.findById(id).orElse(null);
    }

    public ProductBundle createBundle(ProductBundle bundle) {
        bundle.setCreatedAt(System.currentTimeMillis());
        bundle.setUpdatedAt(System.currentTimeMillis());
        return repository.save(bundle);
    }

    public ProductBundle updateBundle(Long id, ProductBundle bundle) {
        ProductBundle existing = repository.findById(id).orElse(null);
        if (existing == null) return null;
        existing.setName(bundle.getName());
        existing.setDescription(bundle.getDescription());
        existing.setProductIds(bundle.getProductIds());
        existing.setBundlePrice(bundle.getBundlePrice());
        existing.setSavingsPercentage(bundle.getSavingsPercentage());
        existing.setStatus(bundle.getStatus());
        existing.setImage(bundle.getImage());
        existing.setUpdatedAt(System.currentTimeMillis());
        return repository.save(existing);
    }

    public void deleteBundle(Long id) {
        repository.deleteById(id);
    }
}
