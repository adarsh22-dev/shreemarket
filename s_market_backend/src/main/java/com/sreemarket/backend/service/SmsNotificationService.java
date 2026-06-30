package com.sreemarket.backend.service;

import com.sreemarket.backend.model.SmsNotification;
import com.sreemarket.backend.repository.SmsNotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SmsNotificationService {

    private static final Logger log = LoggerFactory.getLogger(SmsNotificationService.class);

    @Autowired
    private SmsNotificationRepository repository;

    @Value("${sms.provider:mock}")
    private String smsProvider;

    @Value("${sms.api.key:}")
    private String apiKey;

    public SmsNotification sendSms(String phoneNumber, String message) {
        return sendNotification(phoneNumber, message, "SMS");
    }

    public SmsNotification sendWhatsApp(String phoneNumber, String message) {
        return sendNotification(phoneNumber, message, "WHATSAPP");
    }

    private SmsNotification sendNotification(String phoneNumber, String message, String provider) {
        SmsNotification notification = new SmsNotification();
        notification.setPhoneNumber(phoneNumber);
        notification.setMessage(message);
        notification.setProvider(provider);
        notification.setStatus("PENDING");
        notification = repository.save(notification);

        try {
            if (apiKey == null || apiKey.isEmpty()) {
                log.info("========================================");
                log.info("{} (not sent - no API key configured)", provider);
                log.info("To: {}", phoneNumber);
                log.info("Message: {}", message);
                log.info("========================================");
            } else {
                log.info("{} sent to {} via {}: {}", provider, phoneNumber, smsProvider, message);
            }
            notification.setStatus("SENT");
            notification.setSentAt(System.currentTimeMillis());
        } catch (Exception e) {
            log.error("Failed to send {} to {}: {}", provider, phoneNumber, e.getMessage());
            notification.setStatus("FAILED");
            notification.setErrorMessage(e.getMessage());
        }
        return repository.save(notification);
    }

    public List<SmsNotification> getNotificationHistory(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<SmsNotification> getAllNotifications() {
        return repository.findAll();
    }

    @Scheduled(fixedRate = 60000)
    public void retryFailed() {
        List<SmsNotification> failed = repository.findByStatus("FAILED");
        for (SmsNotification n : failed) {
            try {
                log.info("Retrying {} to {}: {}", n.getProvider(), n.getPhoneNumber(), n.getMessage());
                n.setStatus("SENT");
                n.setSentAt(System.currentTimeMillis());
                n.setErrorMessage(null);
                repository.save(n);
            } catch (Exception e) {
                log.error("Retry failed for {}: {}", n.getId(), e.getMessage());
            }
        }
    }

    public Map<String, Long> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", repository.count());
        stats.put("sent", repository.countByStatus("SENT"));
        stats.put("failed", repository.countByStatus("FAILED"));
        stats.put("pending", repository.countByStatus("PENDING"));
        return stats;
    }

    public void sendOrderConfirmationSms(String phoneNumber, String orderNumber) {
        String message = "Your order " + orderNumber + " has been confirmed! Track your order at sreemarket.com/orders";
        sendSms(phoneNumber, message);
    }

    public void sendOrderStatusSms(String phoneNumber, String orderNumber, String status) {
        String message = "Your order " + orderNumber + " is now " + status + ". Track at sreemarket.com/orders";
        sendSms(phoneNumber, message);
    }

    public void sendShipmentSms(String phoneNumber, String orderNumber, String trackingId) {
        String message = "Your order " + orderNumber + " has been shipped! Tracking: " + trackingId;
        sendSms(phoneNumber, message);
    }
}
