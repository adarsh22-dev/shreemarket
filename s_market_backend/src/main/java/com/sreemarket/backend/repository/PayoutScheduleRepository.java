package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.PayoutSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayoutScheduleRepository extends JpaRepository<PayoutSchedule, Long> {
    List<PayoutSchedule> findByStatus(String status);
    List<PayoutSchedule> findByVendorNameContainingIgnoreCase(String search);
}
