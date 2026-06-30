package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.ProductSchedule;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.repository.ProductScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductSchedulingService {

    @Autowired
    private ProductScheduleRepository productScheduleRepository;

    @Autowired
    private ProductRepository productRepository;

    public List<ProductSchedule> getVendorSchedules(Long vendorId) {
        return productScheduleRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);
    }

    public ProductSchedule createSchedule(ProductSchedule schedule) {
        schedule.setCreatedAt(System.currentTimeMillis());
        schedule.setUpdatedAt(System.currentTimeMillis());
        schedule.setPublished(false);
        return productScheduleRepository.save(schedule);
    }

    public ProductSchedule updateSchedule(Long id, ProductSchedule updated) {
        ProductSchedule existing = productScheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        existing.setPublishAt(updated.getPublishAt());
        existing.setUnpublishAt(updated.getUnpublishAt());
        existing.setUpdatedAt(System.currentTimeMillis());
        return productScheduleRepository.save(existing);
    }

    public void deleteSchedule(Long id) {
        productScheduleRepository.deleteById(id);
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processScheduledProducts() {
        long now = System.currentTimeMillis();

        List<ProductSchedule> toPublish = productScheduleRepository
                .findByPublishedFalseAndPublishAtLessThanEqual(now);
        for (ProductSchedule schedule : toPublish) {
            productRepository.findById(schedule.getProductId()).ifPresent(product -> {
                product.setStatus("in");
                productRepository.save(product);
                schedule.setPublished(true);
                productScheduleRepository.save(schedule);
            });
        }

        List<ProductSchedule> toUnpublish = productScheduleRepository
                .findByPublishedTrueAndUnpublishAtLessThanEqual(now);
        for (ProductSchedule schedule : toUnpublish) {
            productRepository.findById(schedule.getProductId()).ifPresent(product -> {
                product.setStatus("draft");
                productRepository.save(product);
                schedule.setPublished(false);
                productScheduleRepository.save(schedule);
            });
        }
    }
}
