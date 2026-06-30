package com.sreemarket.backend.service;

import com.sreemarket.backend.model.PriceDropAlert;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.repository.PriceDropAlertRepository;
import com.sreemarket.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PriceDropAlertService {

    private final PriceDropAlertRepository repository;
    private final ProductRepository productRepository;
    private final EmailService emailService;

    public PriceDropAlertService(PriceDropAlertRepository repository,
                                 ProductRepository productRepository,
                                 EmailService emailService) {
        this.repository = repository;
        this.productRepository = productRepository;
        this.emailService = emailService;
    }

    public PriceDropAlert createAlert(Long userId, Long productId, Double targetPrice, String email) {
        if (repository.existsByProductIdAndUserIdAndStatus(productId, userId, "ACTIVE")) {
            return null;
        }
        Product product = productRepository.findById(productId).orElse(null);
        PriceDropAlert alert = new PriceDropAlert();
        alert.setUserId(userId);
        alert.setProductId(productId);
        alert.setTargetPrice(targetPrice);
        alert.setCurrentPrice(product != null ? product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getRegularPrice() : 0);
        alert.setEmail(email);
        alert.setStatus("ACTIVE");
        alert.setCreatedAt(System.currentTimeMillis());
        return repository.save(alert);
    }

    public void cancelAlert(Long id, Long userId) {
        PriceDropAlert alert = repository.findById(id).orElse(null);
        if (alert != null && alert.getUserId().equals(userId)) {
            alert.setStatus("CANCELLED");
            repository.save(alert);
        }
    }

    public List<PriceDropAlert> getUserAlerts(Long userId) {
        return repository.findByUserId(userId);
    }

    public void checkPriceAndNotify(Long productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;
        double currentPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getRegularPrice();
        List<PriceDropAlert> alerts = repository.findByProductIdAndStatus(productId, "ACTIVE");
        for (PriceDropAlert alert : alerts) {
            if (currentPrice <= alert.getTargetPrice()) {
                try {
                    emailService.sendPriceDropNotification(alert.getEmail(), product.getName(), currentPrice, alert.getTargetPrice());
                } catch (Exception e) {
                    // Log error
                }
                alert.setStatus("TRIGGERED");
                alert.setTriggeredAt(System.currentTimeMillis());
                repository.save(alert);
            }
        }
    }
}
