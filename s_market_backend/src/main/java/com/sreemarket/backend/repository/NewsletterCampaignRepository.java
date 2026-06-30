package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.NewsletterCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsletterCampaignRepository extends JpaRepository<NewsletterCampaign, Long> {}
