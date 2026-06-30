package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.CommissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommissionCategoryRepository extends JpaRepository<CommissionCategory, Long> {
}
