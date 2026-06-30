package com.sreemarket.backend.service;

import com.sreemarket.backend.model.ShippingZone;
import com.sreemarket.backend.repository.ShippingZoneRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ShippingZoneService {

    private final ShippingZoneRepository repository;

    public ShippingZoneService(ShippingZoneRepository repository) {
        this.repository = repository;
    }

    public List<ShippingZone> getAllZones() {
        return repository.findAll();
    }

    public List<ShippingZone> getActiveZones() {
        return repository.findByIsActiveTrue();
    }

    public ShippingZone getZone(Long id) {
        return repository.findById(id).orElse(null);
    }

    public ShippingZone createZone(ShippingZone zone) {
        zone.setCreatedAt(System.currentTimeMillis());
        zone.setUpdatedAt(System.currentTimeMillis());
        return repository.save(zone);
    }

    public ShippingZone updateZone(Long id, ShippingZone zone) {
        ShippingZone existing = repository.findById(id).orElse(null);
        if (existing == null) return null;
        existing.setName(zone.getName());
        existing.setRegions(zone.getRegions());
        existing.setPincodes(zone.getPincodes());
        existing.setDeliveryType(zone.getDeliveryType());
        existing.setBaseRate(zone.getBaseRate());
        existing.setRatePerKg(zone.getRatePerKg());
        existing.setFreeShippingAbove(zone.getFreeShippingAbove());
        existing.setEstimatedDaysMin(zone.getEstimatedDaysMin());
        existing.setEstimatedDaysMax(zone.getEstimatedDaysMax());
        existing.setIsActive(zone.getIsActive());
        existing.setUpdatedAt(System.currentTimeMillis());
        return repository.save(existing);
    }

    public void deleteZone(Long id) {
        repository.deleteById(id);
    }
}
