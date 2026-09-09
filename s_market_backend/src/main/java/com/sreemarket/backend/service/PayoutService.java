package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Payout;
import com.sreemarket.backend.repository.PayoutRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PayoutService {

    @Autowired
    private PayoutRepository payoutRepository;

    public Payout getPayoutById(Long id) {
        return payoutRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payout not found"));
    }

    @Transactional
    public Payout savePayout(Payout payout) {
        return payoutRepository.save(payout);
    }

    public long getCount() {
        return payoutRepository.count();
    }

    public List<Payout> getAllPayouts() {
        return payoutRepository.findAll();
    }

    public List<Payout> getPayoutsByStatus(String status) {
        return payoutRepository.findByStatus(status);
    }

    public List<Payout> searchPayouts(String search) {
        return payoutRepository.findByVendorNameContainingIgnoreCase(search);
    }
}
