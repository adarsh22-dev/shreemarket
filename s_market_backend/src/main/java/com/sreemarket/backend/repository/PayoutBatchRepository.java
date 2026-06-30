package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.PayoutBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayoutBatchRepository extends JpaRepository<PayoutBatch, Long> {
    List<PayoutBatch> findByStatusOrderByCreatedAtDesc(String status);
    List<PayoutBatch> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(MAX(b.id), 0) FROM PayoutBatch b")
    Long getMaxId();
}
