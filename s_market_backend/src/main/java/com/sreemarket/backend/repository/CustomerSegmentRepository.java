package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.CustomerSegment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerSegmentRepository extends JpaRepository<CustomerSegment, Long> {
    List<CustomerSegment> findByIsActiveTrue();
    List<CustomerSegment> findByNameContainingIgnoreCase(String name);
}
