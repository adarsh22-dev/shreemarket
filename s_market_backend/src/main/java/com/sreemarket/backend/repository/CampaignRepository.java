package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long>, JpaSpecificationExecutor<Campaign> {
    List<Campaign> findByStatus(String status);

    List<Campaign> findByScheduledAtBeforeAndStatus(Long time, String status);
}
