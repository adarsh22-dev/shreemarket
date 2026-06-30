package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Brand;
import com.sreemarket.backend.repository.BrandRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BrandService {

    @Autowired
    private BrandRepository repository;

    public List<Brand> getAll() { return repository.findAll(); }

    public Brand getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found with id: " + id));
    }

    public Brand create(Brand brand) {
        if (brand.getStatus() == null) brand.setStatus("Active");
        return repository.save(brand);
    }

    public Brand update(Long id, Brand data) {
        Brand existing = getById(id);
        if (data.getName() != null) existing.setName(data.getName());
        if (data.getSlug() != null) existing.setSlug(data.getSlug());
        if (data.getDescription() != null) existing.setDescription(data.getDescription());
        if (data.getLogo() != null) existing.setLogo(data.getLogo());
        if (data.getCategory() != null) existing.setCategory(data.getCategory());
        if (data.getCountry() != null) existing.setCountry(data.getCountry());
        if (data.getWebsite() != null) existing.setWebsite(data.getWebsite());
        if (data.getFeatured() != null) existing.setFeatured(data.getFeatured());
        if (data.getVerified() != null) existing.setVerified(data.getVerified());
        if (data.getStatus() != null) existing.setStatus(data.getStatus());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
