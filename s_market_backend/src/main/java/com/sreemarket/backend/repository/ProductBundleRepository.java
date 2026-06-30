package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.ProductBundle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductBundleRepository extends JpaRepository<ProductBundle, Long> {
    List<ProductBundle> findByStatus(String status);
    List<ProductBundle> findByVendorId(Long vendorId);
    List<ProductBundle> findByVendorIdAndStatus(Long vendorId, String status);
}
