package com.sreemarket.backend.service;

import com.sreemarket.backend.model.*;
import com.sreemarket.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VendorAdminService {

    @Autowired private VendorKYCRepository vendorKYCRepository;
    @Autowired private VendorRepository vendorRepository;
    @Autowired private CommissionCategoryRepository commissionCategoryRepository;
    @Autowired private TierRepository tierRepository;
    @Autowired private PayoutRepository payoutRepository;
    @Autowired private OnboardingStepRepository onboardingStepRepository;
    @Autowired private VendorOnboardingRepository vendorOnboardingRepository;
    @Autowired private VendorPerformanceRepository vendorPerformanceRepository;

    // ── KYC ──
    public List<VendorKYC> getAllKyc() { return vendorKYCRepository.findAll(); }
    public List<VendorKYC> searchKyc(String search) { return vendorKYCRepository.findByVendorNameContainingIgnoreCase(search); }
    public Page<VendorKYC> getKycPaginated(String search, Pageable pageable) {
        if (search != null && !search.isEmpty()) {
            return vendorKYCRepository.searchKyc(search, pageable);
        }
        return vendorKYCRepository.findAll(pageable);
    }
    public VendorKYC saveKyc(VendorKYC kyc) { return vendorKYCRepository.save(kyc); }

    // ── Commission Categories ──
    public List<CommissionCategory> getAllCommissionCategories() { return commissionCategoryRepository.findAll(); }
    public CommissionCategory saveCommissionCategory(CommissionCategory cc) { return commissionCategoryRepository.save(cc); }
    public void deleteCommissionCategory(Long id) { commissionCategoryRepository.deleteById(id); }

    // ── Tiers ──
    public List<Tier> getAllTiers() { return tierRepository.findAll(); }
    public Tier saveTier(Tier tier) { return tierRepository.save(tier); }
    public void deleteTier(Long id) { tierRepository.deleteById(id); }
    public int recalculateAllTiers() {
        List<Vendor> vendors = vendorRepository.findAll();
        int updated = 0;
        for (Vendor vendor : vendors) {
            String newTier = "bronze";
            Double revenue = vendor.getTotalRevenue();
            Double rating = vendor.getRating();
            if (revenue != null && rating != null) {
                if (revenue >= 2000000 && rating >= 4.6) {
                    newTier = "platinum";
                } else if (revenue >= 500000 && rating >= 4.3) {
                    newTier = "gold";
                } else if (revenue >= 100000 && rating >= 4.0) {
                    newTier = "silver";
                }
            }
            if (!newTier.equals(vendor.getTier())) {
                vendor.setTier(newTier);
                vendorRepository.save(vendor);
                updated++;
            }
        }
        return updated;
    }

    // ── Payouts ──
    public List<Payout> getAllPayouts() { return payoutRepository.findAll(); }
    public List<Payout> getPayoutsByStatus(String status) { return payoutRepository.findByStatus(status); }
    public List<Payout> searchPayouts(String search) { return payoutRepository.findByVendorNameContainingIgnoreCase(search); }
    public Payout savePayout(Payout payout) { return payoutRepository.save(payout); }

    // ── Onboarding Steps ──
    public List<OnboardingStep> getAllOnboardingSteps() { return onboardingStepRepository.findAll(); }
    public OnboardingStep saveOnboardingStep(OnboardingStep step) { return onboardingStepRepository.save(step); }

    // ── Vendor Onboarding Progress ──
    public List<VendorOnboarding> getVendorOnboarding(Long vendorId) { return vendorOnboardingRepository.findByVendorId(vendorId); }
    public VendorOnboarding saveVendorOnboarding(VendorOnboarding vo) { return vendorOnboardingRepository.save(vo); }
    public List<VendorOnboarding> saveAllVendorOnboarding(List<VendorOnboarding> list) { return vendorOnboardingRepository.saveAll(list); }

    // ── Vendor Performance ──
    public List<VendorPerformance> getAllPerformance() { return vendorPerformanceRepository.findAll(); }
    public VendorPerformance savePerformance(VendorPerformance perf) { return vendorPerformanceRepository.save(perf); }
}
