package com.sreemarket.backend.service;

import com.sreemarket.backend.model.SizeGuide;
import com.sreemarket.backend.repository.SizeGuideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SizeGuideService {

    @Autowired
    private SizeGuideRepository sizeGuideRepository;

    public List<SizeGuide> getAll() {
        return sizeGuideRepository.findAll();
    }

    public List<SizeGuide> getActive() {
        return sizeGuideRepository.findByActiveTrue();
    }

    public SizeGuide getById(Long id) {
        return sizeGuideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Size guide not found with id: " + id));
    }

    public SizeGuide create(SizeGuide guide) {
        return sizeGuideRepository.save(guide);
    }

    public SizeGuide update(Long id, SizeGuide updated) {
        SizeGuide existing = getById(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getCategory() != null) existing.setCategory(updated.getCategory());
        if (updated.getSizeChart() != null) existing.setSizeChart(updated.getSizeChart());
        if (updated.getMeasurementUnit() != null) existing.setMeasurementUnit(updated.getMeasurementUnit());
        if (updated.getFitTips() != null) existing.setFitTips(updated.getFitTips());
        if (updated.getActive() != null) existing.setActive(updated.getActive());
        return sizeGuideRepository.save(existing);
    }

    public void delete(Long id) {
        if (!sizeGuideRepository.existsById(id)) {
            throw new RuntimeException("Size guide not found with id: " + id);
        }
        sizeGuideRepository.deleteById(id);
    }

    public List<SizeGuide> searchByCategory(String category) {
        return sizeGuideRepository.findByCategoryContainingIgnoreCase(category);
    }
}
