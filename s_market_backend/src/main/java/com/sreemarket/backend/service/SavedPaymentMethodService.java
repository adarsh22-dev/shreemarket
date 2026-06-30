package com.sreemarket.backend.service;

import com.sreemarket.backend.model.SavedPaymentMethod;
import com.sreemarket.backend.repository.SavedPaymentMethodRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SavedPaymentMethodService {

    private final SavedPaymentMethodRepository repository;

    public SavedPaymentMethodService(SavedPaymentMethodRepository repository) {
        this.repository = repository;
    }

    public List<SavedPaymentMethod> getUserPaymentMethods(Long userId) {
        return repository.findByUserIdAndIsActiveTrue(userId);
    }

    public SavedPaymentMethod savePaymentMethod(SavedPaymentMethod method) {
        if (method.getIsDefault()) {
            List<SavedPaymentMethod> existing = repository.findByUserIdAndIsActiveTrue(method.getUserId());
            for (SavedPaymentMethod m : existing) {
                m.setIsDefault(false);
                repository.save(m);
            }
        }
        method.setCreatedAt(System.currentTimeMillis());
        method.setUpdatedAt(System.currentTimeMillis());
        return repository.save(method);
    }

    public void deletePaymentMethod(Long id, Long userId) {
        SavedPaymentMethod method = repository.findById(id).orElse(null);
        if (method != null && method.getUserId().equals(userId)) {
            method.setIsActive(false);
            method.setUpdatedAt(System.currentTimeMillis());
            repository.save(method);
        }
    }

    public SavedPaymentMethod setDefault(Long id, Long userId) {
        List<SavedPaymentMethod> methods = repository.findByUserIdAndIsActiveTrue(userId);
        for (SavedPaymentMethod m : methods) {
            m.setIsDefault(m.getId().equals(id));
            m.setUpdatedAt(System.currentTimeMillis());
            repository.save(m);
        }
        return repository.findById(id).orElse(null);
    }
}
