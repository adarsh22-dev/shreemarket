package com.sreemarket.backend.service;

import com.sreemarket.backend.model.PayoutSchedule;
import com.sreemarket.backend.repository.PayoutScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PayoutScheduleService {

    @Autowired
    private PayoutScheduleRepository repository;

    public List<PayoutSchedule> getAll() {
        return repository.findAll();
    }

    public List<PayoutSchedule> getByStatus(String status) {
        return repository.findByStatus(status);
    }

    public List<PayoutSchedule> search(String search) {
        return repository.findByVendorNameContainingIgnoreCase(search);
    }

    public PayoutSchedule save(PayoutSchedule schedule) {
        return repository.save(schedule);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
