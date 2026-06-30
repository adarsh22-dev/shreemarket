package com.sreemarket.backend.service;

import com.sreemarket.backend.model.GSTInvoice;
import com.sreemarket.backend.repository.GSTInvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GSTInvoiceService {

    @Autowired
    private GSTInvoiceRepository repository;

    public List<GSTInvoice> getAll() {
        return repository.findAll();
    }

    public List<GSTInvoice> getByStatus(String status) {
        return repository.findByStatus(status);
    }

    public GSTInvoice getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
    }

    public GSTInvoice create(GSTInvoice invoice) {
        return repository.save(invoice);
    }

    public GSTInvoice update(Long id, GSTInvoice updated) {
        GSTInvoice existing = getById(id);
        existing.setInvoiceId(updated.getInvoiceId());
        existing.setVendor(updated.getVendor());
        existing.setGstin(updated.getGstin());
        existing.setPeriod(updated.getPeriod());
        existing.setGross(updated.getGross());
        existing.setCommission(updated.getCommission());
        existing.setGstOnComm(updated.getGstOnComm());
        existing.setNetComm(updated.getNetComm());
        existing.setTds(updated.getTds());
        existing.setNetPayout(updated.getNetPayout());
        existing.setType(updated.getType());
        existing.setStatus(updated.getStatus());
        existing.setIssued(updated.getIssued());
        existing.setDue(updated.getDue());
        return repository.save(existing);
    }

    public GSTInvoice updateStatus(Long id, String status) {
        GSTInvoice existing = getById(id);
        existing.setStatus(status);
        return repository.save(existing);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Invoice not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
