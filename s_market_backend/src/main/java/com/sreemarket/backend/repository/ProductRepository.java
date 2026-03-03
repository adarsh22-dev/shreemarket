package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    List<Product> findByVendorId(Long vendorId);

    List<Product> findByNameContainingIgnoreCase(String name);
}
