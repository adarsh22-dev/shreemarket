package com.sreemarket.backend.service;

import com.sreemarket.backend.model.BackInStockAlert;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.repository.BackInStockAlertRepository;
import com.sreemarket.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BackInStockAlertService {

    private final BackInStockAlertRepository repository;
    private final ProductRepository productRepository;
    private final EmailService emailService;

    public BackInStockAlertService(BackInStockAlertRepository repository,
                                   ProductRepository productRepository,
                                   EmailService emailService) {
        this.repository = repository;
        this.productRepository = productRepository;
        this.emailService = emailService;
    }

    public BackInStockAlert createAlert(Long userId, Long productId, String email) {
        if (repository.existsByProductIdAndUserIdAndStatus(productId, userId, "ACTIVE")) {
            return null;
        }
        BackInStockAlert alert = new BackInStockAlert();
        alert.setUserId(userId);
        alert.setProductId(productId);
        alert.setEmail(email);
        alert.setStatus("ACTIVE");
        alert.setCreatedAt(System.currentTimeMillis());
        return repository.save(alert);
    }

    public void cancelAlert(Long id, Long userId) {
        BackInStockAlert alert = repository.findById(id).orElse(null);
        if (alert != null && alert.getUserId().equals(userId)) {
            alert.setStatus("CANCELLED");
            repository.save(alert);
        }
    }

    public List<BackInStockAlert> getUserAlerts(Long userId) {
        return repository.findByUserId(userId);
    }

    public void processRestockedProduct(Long productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;
        List<BackInStockAlert> alerts = repository.findByProductIdAndStatus(productId, "ACTIVE");
        for (BackInStockAlert alert : alerts) {
            try {
                emailService.sendBackInStockNotification(alert.getEmail(), product.getName());
            } catch (Exception e) {
                // Log error
            }
            alert.setStatus("NOTIFIED");
            alert.setNotifiedAt(System.currentTimeMillis());
            repository.save(alert);
        }
    }
}
