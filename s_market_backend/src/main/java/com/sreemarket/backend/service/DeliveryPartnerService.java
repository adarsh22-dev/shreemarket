package com.sreemarket.backend.service;

import com.sreemarket.backend.model.DeliveryPartner;
import com.sreemarket.backend.repository.DeliveryPartnerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryPartnerService {

    @Autowired
    private DeliveryPartnerRepository repository;

    public List<DeliveryPartner> getAll() {
        return repository.findAll();
    }

    public List<DeliveryPartner> getByStatus(String status) {
        return repository.findByStatus(status);
    }

    public DeliveryPartner getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery partner not found with id: " + id));
    }

    public DeliveryPartner create(DeliveryPartner partner) {
        return repository.save(partner);
    }

    public DeliveryPartner update(Long id, DeliveryPartner updated) {
        DeliveryPartner existing = getById(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getCode() != null) existing.setCode(updated.getCode());
        if (updated.getCoverage() != null) existing.setCoverage(updated.getCoverage());
        if (updated.getPhone() != null) existing.setPhone(updated.getPhone());
        if (updated.getEmail() != null) existing.setEmail(updated.getEmail());
        if (updated.getActiveOrders() != null) existing.setActiveOrders(updated.getActiveOrders());
        if (updated.getDelivered() != null) existing.setDelivered(updated.getDelivered());
        if (updated.getRating() != null) existing.setRating(updated.getRating());
        if (updated.getAvgDays() != null) existing.setAvgDays(updated.getAvgDays());
        if (updated.getCost() != null) existing.setCost(updated.getCost());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        if (updated.getColor() != null) existing.setColor(updated.getColor());
        if (updated.getJoined() != null) existing.setJoined(updated.getJoined());
        return repository.save(existing);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Delivery partner not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
