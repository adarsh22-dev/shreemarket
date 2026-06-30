package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.SizeGuide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SizeGuideRepository extends JpaRepository<SizeGuide, Long> {
    List<SizeGuide> findByActiveTrue();
    List<SizeGuide> findByCategoryContainingIgnoreCase(String category);
    List<SizeGuide> findByNameContainingIgnoreCase(String name);
}
