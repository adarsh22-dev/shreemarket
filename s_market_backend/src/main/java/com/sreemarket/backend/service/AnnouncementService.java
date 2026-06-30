package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Announcement;
import com.sreemarket.backend.repository.AnnouncementRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AnnouncementService {

    private final AnnouncementRepository repository;

    public AnnouncementService(AnnouncementRepository repository) {
        this.repository = repository;
    }

    public List<Announcement> getAllAnnouncements() {
        return repository.findAll();
    }

    public List<Announcement> getActiveAnnouncements() {
        return repository.findByStatusOrderByCreatedAtDesc("ACTIVE");
    }

    public List<Announcement> getAnnouncementsForAudience(String audience) {
        return repository.findByTargetAudienceAndStatus(audience, "ACTIVE");
    }

    public Announcement getAnnouncement(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Announcement createAnnouncement(Announcement announcement) {
        announcement.setCreatedAt(System.currentTimeMillis());
        announcement.setUpdatedAt(System.currentTimeMillis());
        if (announcement.getStatus() == null) {
            announcement.setStatus("DRAFT");
        }
        return repository.save(announcement);
    }

    public Announcement updateAnnouncement(Long id, Announcement announcement) {
        Announcement existing = repository.findById(id).orElse(null);
        if (existing == null) return null;
        existing.setTitle(announcement.getTitle());
        existing.setMessage(announcement.getMessage());
        existing.setType(announcement.getType());
        existing.setTargetAudience(announcement.getTargetAudience());
        existing.setStatus(announcement.getStatus());
        existing.setScheduledAt(announcement.getScheduledAt());
        existing.setExpiresAt(announcement.getExpiresAt());
        existing.setUpdatedAt(System.currentTimeMillis());
        return repository.save(existing);
    }

    public void deleteAnnouncement(Long id) {
        repository.deleteById(id);
    }
}
