package com.sreemarket.backend.service;

import com.sreemarket.backend.model.TaxRate;
import com.sreemarket.backend.repository.TaxRateRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class TaxRateService {

    @Autowired
    private TaxRateRepository repository;

    private static final List<GSTSlab> DEFAULT_SLABS = Arrays.asList(
        new GSTSlab("GST 0% (Exempted)",    0.0,  "NIL",   "Exempted goods — food, books, education",    0.0, "all"),
        new GSTSlab("GST 5%",                5.0,  "5%",    "Essential items — packaged food, footwear",   1.0, "groceries, food, footwear"),
        new GSTSlab("GST 12%",              12.0,  "12%",   "Standard rate — computers, processed food",   1.0, "electronics, processed-food"),
        new GSTSlab("GST 18%",              18.0,  "18%",   "Standard rate — smartphones, soaps, services",1.0, "electronics, personal-care, services"),
        new GSTSlab("GST 28%",              28.0,  "28%",   "Luxury — cars, tobacco, luxury goods",        1.0, "luxury, automotive")
    );

    @PostConstruct
    public void seedDefaults() {
        if (repository.count() > 0) return;
        for (GSTSlab slab : DEFAULT_SLABS) {
            TaxRate tr = new TaxRate();
            tr.setName(slab.name);
            tr.setRate(slab.rate);
            tr.setTaxType("GST");
            tr.setHsnCode(slab.hsnDisplay);
            double half = slab.rate / 2.0;
            tr.setCgst(half);
            tr.setSgst(half);
            tr.setIgst(slab.rate);
            tr.setTcsRate(slab.tcsRate);
            tr.setDescription(slab.desc);
            tr.setApplicableCategories(slab.categories);
            tr.setStatus("ACTIVE");
            tr.setIsDefault(slab.rate == 18.0);
            tr.setEffectiveFrom(System.currentTimeMillis());
            repository.save(tr);
        }
    }

    public List<TaxRate> getAll() {
        return repository.findAll();
    }

    public List<TaxRate> getActive() {
        return repository.findByStatus("ACTIVE");
    }

    public TaxRate getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tax rate not found with id: " + id));
    }

    public TaxRate create(TaxRate taxRate) {
        splitGst(taxRate);
        if (taxRate.getIsDefault() != null && taxRate.getIsDefault()) {
            clearOtherDefaults(null);
        }
        if (taxRate.getStatus() == null) taxRate.setStatus("ACTIVE");
        if (taxRate.getTcsRate() == null) taxRate.setTcsRate(1.0);
        return repository.save(taxRate);
    }

    public TaxRate update(Long id, TaxRate updated) {
        TaxRate existing = getById(id);
        existing.setName(updated.getName());
        existing.setRate(updated.getRate());
        existing.setTaxType(updated.getTaxType());
        existing.setHsnCode(updated.getHsnCode());
        existing.setDescription(updated.getDescription());
        existing.setApplicableCategories(updated.getApplicableCategories());
        existing.setStatus(updated.getStatus());
        existing.setEffectiveFrom(updated.getEffectiveFrom());
        existing.setEffectiveTo(updated.getEffectiveTo());
        if (updated.getTcsRate() != null) existing.setTcsRate(updated.getTcsRate());
        splitGst(existing);

        if (updated.getIsDefault() != null && updated.getIsDefault() && !Boolean.TRUE.equals(existing.getIsDefault())) {
            clearOtherDefaults(id);
            existing.setIsDefault(true);
        } else if (updated.getIsDefault() != null) {
            existing.setIsDefault(updated.getIsDefault());
        }

        return repository.save(existing);
    }

    public TaxRate toggleStatus(Long id) {
        TaxRate existing = getById(id);
        existing.setStatus("ACTIVE".equals(existing.getStatus()) ? "INACTIVE" : "ACTIVE");
        return repository.save(existing);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Tax rate not found with id: " + id);
        }
        repository.deleteById(id);
    }

    private void splitGst(TaxRate tr) {
        if (tr.getRate() == null) return;
        double half = tr.getRate() / 2.0;
        tr.setCgst(half);
        tr.setSgst(half);
        tr.setIgst(tr.getRate());
    }

    private void clearOtherDefaults(Long excludeId) {
        List<TaxRate> defaults = repository.findByIsDefaultTrue();
        for (TaxRate d : defaults) {
            if (excludeId == null || !d.getId().equals(excludeId)) {
                d.setIsDefault(false);
                repository.save(d);
            }
        }
    }

    private static class GSTSlab {
        final String name;
        final double rate;
        final String hsnDisplay;
        final String desc;
        final double tcsRate;
        final String categories;
        GSTSlab(String name, double rate, String hsn, String desc, double tcsRate, String categories) {
            this.name = name; this.rate = rate; this.hsnDisplay = hsn;
            this.desc = desc; this.tcsRate = tcsRate; this.categories = categories;
        }
    }
}
