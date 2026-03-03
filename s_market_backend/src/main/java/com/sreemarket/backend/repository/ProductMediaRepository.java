package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.ProductMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductMediaRepository extends JpaRepository<ProductMedia, Long> {
}
