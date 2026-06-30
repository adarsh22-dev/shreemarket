package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.HomepageSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomepageSectionRepository extends JpaRepository<HomepageSection, Long> {
    List<HomepageSection> findAllByOrderBySortOrderAsc();
    List<HomepageSection> findByVisibleTrueOrderBySortOrderAsc();
}
