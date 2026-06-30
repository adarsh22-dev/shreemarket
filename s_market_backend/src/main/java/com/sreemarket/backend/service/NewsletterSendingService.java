package com.sreemarket.backend.service;

import com.sreemarket.backend.model.NewsletterCampaign;
import com.sreemarket.backend.model.SubscriberList;
import com.sreemarket.backend.repository.NewsletterCampaignRepository;
import com.sreemarket.backend.repository.SubscriberListRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class NewsletterSendingService {

    private static final Logger log = LoggerFactory.getLogger(NewsletterSendingService.class);

    @Autowired
    private NewsletterCampaignRepository campaignRepository;

    @Autowired
    private SubscriberListRepository subscriberListRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Send a specific campaign immediately.
     */
    public NewsletterCampaign sendCampaign(Long campaignId) {
        NewsletterCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + campaignId));

        if ("sent".equalsIgnoreCase(campaign.getStatus())) {
            throw new RuntimeException("Campaign already sent");
        }

        // Get subscribers from the list
        String listId = campaign.getListId();
        List<SubscriberList> allLists = subscriberListRepository.findAll();

        // Find target subscribers
        SubscriberList targetList = null;
        try {
            Long id = Long.parseLong(listId);
            targetList = subscriberListRepository.findById(id).orElse(null);
        } catch (NumberFormatException e) {
            targetList = allLists.stream()
                    .filter(l -> l.getName().equalsIgnoreCase(listId))
                    .findFirst().orElse(null);
        }

        int recipientCount = 0;
        int sentCount = 0;

        if (targetList != null) {
            String emails = targetList.getEmails();
            if (emails != null && !emails.isEmpty()) {
                String[] emailArray = emails.split(",");
                recipientCount = emailArray.length;

                // Build campaign HTML
                String htmlBody = buildCampaignHtml(campaign.getSubject());
                String textBody = campaign.getSubject() + "\n\nView this email in your browser.";

                // Send to each subscriber
                for (String email : emailArray) {
                    String trimmedEmail = email.trim();
                    if (!trimmedEmail.isEmpty()) {
                        try {
                            emailService.sendEmail(trimmedEmail, "Subscriber", campaign.getSubject(), htmlBody, textBody);
                            sentCount++;
                        } catch (Exception e) {
                            log.error("Failed to send campaign email to {}: {}", trimmedEmail, e.getMessage());
                        }
                    }
                }
            }
        }

        campaign.setStatus("sent");
        campaign.setSent(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        campaign.setRecipients(recipientCount);
        campaign.setOpens(0);
        campaign.setClicks(0);
        campaign.setUnsubscribes(0);
        return campaignRepository.save(campaign);
    }

    /**
     * Send a campaign with custom content.
     */
    public NewsletterCampaign sendCampaignWithContent(Long campaignId, String htmlContent, String textContent) {
        NewsletterCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + campaignId));

        String listId = campaign.getListId();
        List<SubscriberList> allLists = subscriberListRepository.findAll();

        SubscriberList targetList = null;
        try {
            Long id = Long.parseLong(listId);
            targetList = subscriberListRepository.findById(id).orElse(null);
        } catch (NumberFormatException e) {
            targetList = allLists.stream()
                    .filter(l -> l.getName().equalsIgnoreCase(listId))
                    .findFirst().orElse(null);
        }

        int recipientCount = 0;
        int sentCount = 0;

        if (targetList != null) {
            String emails = targetList.getEmails();
            if (emails != null && !emails.isEmpty()) {
                String[] emailArray = emails.split(",");
                recipientCount = emailArray.length;

                for (String email : emailArray) {
                    String trimmedEmail = email.trim();
                    if (!trimmedEmail.isEmpty()) {
                        try {
                            emailService.sendEmail(trimmedEmail, "Subscriber", campaign.getSubject(),
                                    htmlContent != null ? htmlContent : buildCampaignHtml(campaign.getSubject()),
                                    textContent != null ? textContent : campaign.getSubject());
                            sentCount++;
                        } catch (Exception e) {
                            log.error("Failed to send: {}", e.getMessage());
                        }
                    }
                }
            }
        }

        campaign.setStatus("sent");
        campaign.setSent(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        campaign.setRecipients(recipientCount);
        return campaignRepository.save(campaign);
    }

    /**
     * Scheduled task to send pending scheduled campaigns.
     */
    @Scheduled(fixedRate = 60000) // Check every minute
    public void processScheduledCampaigns() {
        List<NewsletterCampaign> scheduled = campaignRepository.findAll().stream()
                .filter(c -> "scheduled".equalsIgnoreCase(c.getStatus()) && c.getScheduled() != null)
                .toList();

        LocalDateTime now = LocalDateTime.now();
        for (NewsletterCampaign campaign : scheduled) {
            try {
                LocalDateTime scheduledTime = LocalDateTime.parse(campaign.getScheduled(),
                        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
                if (scheduledTime.isBefore(now) || scheduledTime.isEqual(now)) {
                    sendCampaign(campaign.getId());
                    log.info("Sent scheduled campaign: {}", campaign.getSubject());
                }
            } catch (Exception e) {
                log.error("Failed to process scheduled campaign {}: {}", campaign.getId(), e.getMessage());
            }
        }
    }

    private String buildCampaignHtml(String subject) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>"
                + "<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;'>"
                + "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff;'>"
                + "<div style='background: linear-gradient(135deg, #FF5722, #E64A19); padding: 30px; text-align: center;'>"
                + "<h1 style='color: #ffffff; margin: 0; font-size: 24px;'>SreeMarket</h1></div>"
                + "<div style='padding: 40px 30px;'>"
                + "<h2 style='color: #333; margin-top: 0;'>" + subject + "</h2>"
                + "<p style='color: #666; line-height: 1.6;'>Check out the latest updates, offers, and new arrivals from SreeMarket!</p>"
                + "<div style='text-align: center; margin: 30px 0;'>"
                + "<a href='#' style='display: inline-block; background: linear-gradient(135deg, #FF5722, #E64A19); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-size: 16px; font-weight: bold;'>Shop Now</a>"
                + "</div></div>"
                + "<div style='background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;'>"
                + "<p style='color: #999; font-size: 12px; margin: 0;'>© 2026 SreeMarket. All rights reserved.</p>"
                + "</div></div></body></html>";
    }
}
