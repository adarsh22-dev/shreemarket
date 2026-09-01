package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    List<Product> findByIsFeaturedTrue();
    List<Product> findByIsFeaturedTrueAndApprovalStatus(String approvalStatus);
    List<Product> findByVendorId(Long vendorId);

    List<Product> findByNameContainingIgnoreCase(String name);

    List<Product> findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(String name, String sku);

    List<Product> findByApprovalStatus(String approvalStatus);

    @Query("SELECT p FROM Product p WHERE p.approvalStatus = :approvalStatus " +
           "AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :term, '%')))")
    List<Product> searchApprovedByNameOrSku(@Param("term") String term, @Param("approvalStatus") String approvalStatus);

    long countByApprovalStatus(String approvalStatus);

    long countByCategory(String category);

    long countBySubCategory(String subCategory);

    Product findBySku(String sku);

    List<Product> findByApprovalStatusAndCreatedAtAfter(String approvalStatus, Long createdAtAfter);

    List<Product> findByCategoryAndApprovalStatus(String category, String approvalStatus);

    List<Product> findBySupportsWholesaleTrueAndApprovalStatus(String approvalStatus);
}
