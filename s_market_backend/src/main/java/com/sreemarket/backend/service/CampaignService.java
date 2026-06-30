package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Campaign;
import com.sreemarket.backend.model.User;
import com.sreemarket.backend.model.Vendor;
import com.sreemarket.backend.repository.CampaignRepository;
import com.sreemarket.backend.repository.UserRepository;
import com.sreemarket.backend.repository.VendorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CampaignService {

    private static final Logger log = LoggerFactory.getLogger(CampaignService.class);

    @Autowired
    private CampaignRepository campaignRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private SmsNotificationService smsNotificationService;

    @Autowired
    private EmailService emailService;

    public List<Campaign> getAllCampaigns() {
        return campaignRepository.findAll();
    }

    public Campaign getCampaign(Long id) {
        return campaignRepository.findById(id).orElse(null);
    }

    public Campaign createCampaign(Campaign campaign) {
        if (campaign.getStatus() == null) {
            campaign.setStatus("DRAFT");
        }
        if (campaign.getTotalRecipients() == null) {
            campaign.setTotalRecipients(0);
        }
        if (campaign.getSuccessCount() == null) {
            campaign.setSuccessCount(0);
        }
        if (campaign.getFailCount() == null) {
            campaign.setFailCount(0);
        }
        return campaignRepository.save(campaign);
    }

    public Campaign updateCampaign(Long id, Campaign updated) {
        Campaign existing = campaignRepository.findById(id).orElse(null);
        if (existing == null) return null;
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getType() != null) existing.setType(updated.getType());
        if (updated.getSubject() != null) existing.setSubject(updated.getSubject());
        if (updated.getBody() != null) existing.setBody(updated.getBody());
        if (updated.getTargetAudience() != null) existing.setTargetAudience(updated.getTargetAudience());
        if (updated.getRecipientIds() != null) existing.setRecipientIds(updated.getRecipientIds());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        if (updated.getScheduledAt() != null) existing.setScheduledAt(updated.getScheduledAt());
        return campaignRepository.save(existing);
    }

    public void deleteCampaign(Long id) {
        campaignRepository.deleteById(id);
    }

    @Transactional
    public Campaign sendCampaign(Long campaignId) {
        Campaign campaign = campaignRepository.findById(campaignId).orElse(null);
        if (campaign == null) return null;

        campaign.setStatus("SENDING");
        campaign = campaignRepository.save(campaign);

        List<String> recipients = resolveRecipients(campaign);
        campaign.setTotalRecipients(recipients.size());

        int success = 0;
        int fail = 0;

        for (String recipient : recipients) {
            try {
                if ("SMS".equals(campaign.getType())) {
                    smsNotificationService.sendSms(recipient, campaign.getBody());
                } else if ("WHATSAPP".equals(campaign.getType())) {
                    smsNotificationService.sendWhatsApp(recipient, campaign.getBody());
                } else if ("EMAIL".equals(campaign.getType())) {
                    emailService.sendEmail(recipient, "", campaign.getSubject(), campaign.getBody(), null);
                }
                success++;
            } catch (Exception e) {
                log.error("Failed to send campaign {} to {}: {}", campaignId, recipient, e.getMessage());
                fail++;
            }
        }

        campaign.setSuccessCount(success);
        campaign.setFailCount(fail);
        campaign.setSentAt(System.currentTimeMillis());
        campaign.setStatus("COMPLETED");
        return campaignRepository.save(campaign);
    }

    private List<String> resolveRecipients(Campaign campaign) {
        String audience = campaign.getTargetAudience();
        if ("ALL".equals(audience)) {
            List<String> all = new ArrayList<>();
            List<User> users = userRepository.findAll();
            for (User u : users) {
                if (u.getEmail() != null && !u.getEmail().isEmpty()) all.add(u.getEmail());
                if (u.getPhone() != null && !u.getPhone().isEmpty() && !"EMAIL".equals(campaign.getType())) all.add(u.getPhone());
            }
            return all;
        } else if ("CUSTOMERS".equals(audience)) {
            List<User> users = userRepository.findAll();
            return users.stream()
                    .filter(u -> u.getRoleId() == null || u.getRoleId() == 2)
                    .map(u -> "EMAIL".equals(campaign.getType()) ? u.getEmail() : u.getPhone())
                    .filter(Objects::nonNull)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        } else if ("VENDORS".equals(audience)) {
            List<Vendor> vendors = vendorRepository.findAll();
            return vendors.stream()
                    .map(v -> "EMAIL".equals(campaign.getType()) ? v.getEmail() : v.getPhone())
                    .filter(Objects::nonNull)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        } else if ("SPECIFIC".equals(audience) && campaign.getRecipientIds() != null) {
            // recipientIds is a comma-separated list of user IDs
            String[] ids = campaign.getRecipientIds().split(",");
            List<String> recipients = new ArrayList<>();
            for (String idStr : ids) {
                try {
                    Long uid = Long.parseLong(idStr.trim());
                    Optional<User> u = userRepository.findById(uid);
                    if (u.isPresent()) {
                        String contact = "EMAIL".equals(campaign.getType()) ? u.get().getEmail() : u.get().getPhone();
                        if (contact != null && !contact.isEmpty()) recipients.add(contact);
                    }
                } catch (NumberFormatException ignored) {}
            }
            return recipients;
        }
        return Collections.emptyList();
    }

    @Scheduled(fixedRate = 30000)
    public void processScheduledCampaigns() {
        long now = System.currentTimeMillis();
        List<Campaign> due = campaignRepository.findByScheduledAtBeforeAndStatus(now, "SCHEDULED");
        for (Campaign c : due) {
            try {
                sendCampaign(c.getId());
                log.info("Scheduled campaign {} executed", c.getId());
            } catch (Exception e) {
                log.error("Failed to execute scheduled campaign {}: {}", c.getId(), e.getMessage());
            }
        }
    }

    public Map<String, Long> getStats() {
        Map<String, Long> stats = new HashMap<>();
        List<Campaign> all = campaignRepository.findAll();
        stats.put("total", (long) all.size());
        stats.put("draft", all.stream().filter(c -> "DRAFT".equals(c.getStatus())).count());
        stats.put("scheduled", all.stream().filter(c -> "SCHEDULED".equals(c.getStatus())).count());
        stats.put("sending", all.stream().filter(c -> "SENDING".equals(c.getStatus())).count());
        stats.put("sent", all.stream().filter(c -> "SENT".equals(c.getStatus()) || "COMPLETED".equals(c.getStatus())).count());
        stats.put("failed", all.stream().filter(c -> "FAILED".equals(c.getStatus())).count());
        return stats;
    }
}
