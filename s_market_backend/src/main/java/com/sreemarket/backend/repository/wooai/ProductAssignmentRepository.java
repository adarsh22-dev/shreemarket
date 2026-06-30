package com.sreemarket.backend.repository.wooai;

import com.sreemarket.backend.model.wooai.ProductAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductAssignmentRepository extends JpaRepository<ProductAssignment, Long> {
    List<ProductAssignment> findBySectionKey(String sectionKey);
    void deleteBySectionKeyAndProductId(String sectionKey, String productId);
}
