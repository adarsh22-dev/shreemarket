package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.ProductLinked;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductLinkedRepository extends JpaRepository<ProductLinked, Long> {
}
