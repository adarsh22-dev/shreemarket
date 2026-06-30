package com.sreemarket.backend.repository;

import com.sreemarket.backend.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByStatusOrderByCreatedAtDesc(String status);
    List<Announcement> findByTargetAudienceAndStatus(String targetAudience, String status);
    List<Announcement> findByType(String type);
}
