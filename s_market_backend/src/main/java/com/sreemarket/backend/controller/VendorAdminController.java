package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.*;
import com.sreemarket.backend.repository.*;
import com.sreemarket.backend.service.VendorActivityService;
import com.sreemarket.backend.service.VendorAdminService;
import com.sreemarket.backend.service.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/admin/vendors")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorAdminController {

    @Autowired private VendorAdminService vendorAdminService;
    @Autowired private VendorActivityService vendorActivityService;
    @Autowired private VendorService vendorService;
    @Autowired private VendorRepository vendorRepository;
    @Autowired private StoreRepository storeRepository;
    @Autowired private PayoutRepository payoutRepository;

    // ── Basic Vendor CRUD ──
    @GetMapping
    public ResponseEntity<?> getVendors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Page<Vendor> vendors = vendorService.getVendors(search, status, page, size, sortDir, sortBy);
            return ResponseEntity.ok(vendors);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getVendorById(@PathVariable Long id) {
        try {
            Vendor vendor = vendorService.getVendorById(id);
            vendor.setPassword(null);
            return ResponseEntity.ok(vendor);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateVendor(@PathVariable Long id, @RequestBody Vendor updated) {
        try {
            Vendor saved = vendorService.updateVendor(id, updated);
            saved.setPassword(null);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVendor(@PathVariable Long id) {
        try {
            vendorRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Vendor deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Vendor Status ──
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateVendorStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String newStatus = body.get("status");
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            Vendor updated = vendorService.updateVendorStatus(id, newStatus);
            updated.setPassword(null);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Vendor Applications ──
    @GetMapping("/applications")
    public ResponseEntity<?> getApplications(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<Vendor> applications = vendorService.getVendors(search, "Pending", page, size, "createdAt", "desc");
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/applications/{id}/status")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String newStatus = body.get("status");
            if (newStatus == null || (!"Approved".equals(newStatus) && !"Rejected".equals(newStatus))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status must be 'Approved' or 'Rejected'"));
            }
            Vendor updated = vendorService.updateVendorStatus(id, newStatus);
            updated.setPassword(null);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Vendor Stores (Admin) ──
    @GetMapping("/{vendorId}/stores")
    public ResponseEntity<?> getVendorStores(@PathVariable Long vendorId) {
        try {
            List<Store> stores = storeRepository.findByVendorId(vendorId);
            return ResponseEntity.ok(stores);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{vendorId}/stores")
    public ResponseEntity<?> createVendorStore(@PathVariable Long vendorId, @RequestBody Store store) {
        try {
            Vendor vendor = vendorRepository.findById(vendorId)
                    .orElseThrow(() -> new RuntimeException("Vendor not found"));
            store.setVendor(vendor);
            Store saved = storeRepository.save(store);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{vendorId}/stores/{storeId}")
    public ResponseEntity<?> updateVendorStore(@PathVariable Long vendorId, @PathVariable Long storeId,
                                                @RequestBody Store update) {
        try {
            Store existing = storeRepository.findById(storeId)
                    .orElseThrow(() -> new RuntimeException("Store not found"));
            if (!existing.getVendor().getId().equals(vendorId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Store does not belong to this vendor"));
            }
            if (update.getStoreName() != null) existing.setStoreName(update.getStoreName());
            if (update.getDescription() != null) existing.setDescription(update.getDescription());
            if (update.getCity() != null) existing.setCity(update.getCity());
            if (update.getState() != null) existing.setState(update.getState());
            if (update.getCountry() != null) existing.setCountry(update.getCountry());
            if (update.getPincode() != null) existing.setPincode(update.getPincode());
            if (update.getPhoneNumber() != null) existing.setPhoneNumber(update.getPhoneNumber());
            if (update.getEmailAddress() != null) existing.setEmailAddress(update.getEmailAddress());
            if (update.getFullAddress() != null) existing.setFullAddress(update.getFullAddress());
            if (update.getStoreLogo() != null) existing.setStoreLogo(update.getStoreLogo());
            Store saved = storeRepository.save(existing);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{vendorId}/stores/{storeId}")
    public ResponseEntity<?> deleteVendorStore(@PathVariable Long vendorId, @PathVariable Long storeId) {
        try {
            Store existing = storeRepository.findById(storeId)
                    .orElseThrow(() -> new RuntimeException("Store not found"));
            if (!existing.getVendor().getId().equals(vendorId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Store does not belong to this vendor"));
            }
            storeRepository.deleteById(storeId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── KYC (with pagination) ──
    @GetMapping("/kyc")
    public ResponseEntity<?> getKyc(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            Page<VendorKYC> kycPage = vendorAdminService.getKycPaginated(search, pageable);

            // Enrich KYC records with parsed payment details and status fields
            List<Map<String, Object>> enriched = new ArrayList<>();
            for (VendorKYC k : kycPage.getContent()) {
                Map<String, Object> m = enrichKycRecord(k);
                enriched.add(m);
            }

            // Return paginated response with enriched content
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("content", enriched);
            response.put("totalElements", kycPage.getTotalElements());
            response.put("totalPages", kycPage.getTotalPages());
            response.put("number", kycPage.getNumber());
            response.put("size", kycPage.getSize());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/kyc")
    public ResponseEntity<?> updateKyc(@RequestBody VendorKYC kyc) {
        try {
            return ResponseEntity.ok(vendorAdminService.saveKyc(kyc));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/kyc")
    public ResponseEntity<?> createKyc(@RequestBody VendorKYC kyc) {
        try {
            return ResponseEntity.ok(vendorAdminService.saveKyc(kyc));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Combined Vendor + KYC ──
    @GetMapping("/kyc/combined")
    public ResponseEntity<?> getCombinedVendorKyc(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Page<Vendor> vendors = vendorService.getVendors(search, status, page, size, sortDir, sortBy);
            List<Map<String, Object>> combined = new ArrayList<>();
            for (Vendor v : vendors.getContent()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("vendor", v);
                VendorKYC kyc = vendorAdminService.getAllKyc().stream()
                        .filter(k -> k.getVendorId() != null && k.getVendorId().equals(v.getId()))
                        .findFirst().orElse(null);
                if (kyc != null) {
                    Map<String, Object> enrichedKyc = enrichKycRecord(kyc);
                    m.put("kyc", enrichedKyc);
                } else {
                    m.put("kyc", null);
                }
                combined.add(m);
            }
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("content", combined);
            response.put("totalElements", vendors.getTotalElements());
            response.put("totalPages", vendors.getTotalPages());
            response.put("number", vendors.getNumber());
            response.put("size", vendors.getSize());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Commission Categories ──
    @GetMapping("/commission-categories")
    public ResponseEntity<?> getCommissionCategories() {
        try {
            return ResponseEntity.ok(vendorAdminService.getAllCommissionCategories());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/commission-categories")
    public ResponseEntity<?> createCommissionCategory(@RequestBody CommissionCategory cc) {
        try {
            return ResponseEntity.ok(vendorAdminService.saveCommissionCategory(cc));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/commission-categories/{id}")
    public ResponseEntity<?> updateCommissionCategory(@PathVariable Long id, @RequestBody CommissionCategory cc) {
        try {
            cc.setId(id);
            return ResponseEntity.ok(vendorAdminService.saveCommissionCategory(cc));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/commission-categories/{id}")
    public ResponseEntity<?> deleteCommissionCategory(@PathVariable Long id) {
        try {
            vendorAdminService.deleteCommissionCategory(id);
            return ResponseEntity.ok(Map.of("message", "Deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Tiers ──
    @GetMapping("/tiers")
    public ResponseEntity<?> getTiers() {
        try {
            return ResponseEntity.ok(vendorAdminService.getAllTiers());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/tiers")
    public ResponseEntity<?> updateTier(@RequestBody Tier tier) {
        try {
            return ResponseEntity.ok(vendorAdminService.saveTier(tier));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/tiers/recalculate")
    public ResponseEntity<?> recalculateTiers() {
        try {
            int count = vendorAdminService.recalculateAllTiers();
            return ResponseEntity.ok(Map.of("message", "Tiers recalculated", "updated", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/tiers")
    public ResponseEntity<?> createTier(@RequestBody Tier tier) {
        try {
            Tier saved = vendorAdminService.saveTier(tier);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/tiers/{id}")
    public ResponseEntity<?> deleteTier(@PathVariable Long id) {
        try {
            vendorAdminService.deleteTier(id);
            return ResponseEntity.ok(Map.of("message", "Tier deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Payouts ──
    @GetMapping("/payouts")
    public ResponseEntity<?> getPayouts(@RequestParam(required = false) String status,
                                         @RequestParam(required = false) String search) {
        try {
            if (search != null && !search.isEmpty()) return ResponseEntity.ok(vendorAdminService.searchPayouts(search));
            if (status != null && !status.isEmpty()) return ResponseEntity.ok(vendorAdminService.getPayoutsByStatus(status));
            return ResponseEntity.ok(vendorAdminService.getAllPayouts());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/payouts")
    public ResponseEntity<?> createPayout(@RequestBody Map<String, Object> request) {
        try {
            String method = request.get("method") != null ? request.get("method").toString() : "NEFT";
            String vendorName = request.get("vendorName") != null ? request.get("vendorName").toString() : "Unknown";
            Long vendorId = request.get("vendorId") != null ? Long.valueOf(request.get("vendorId").toString()) : null;
            Double grossAmount = request.get("grossAmount") != null ? Double.valueOf(request.get("grossAmount").toString()) : 0.0;
            String period = request.get("period") != null ? request.get("period").toString() : "";

            Payout payout = new Payout();
            String datePart = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
            payout.setPayoutId("PAY-" + datePart + "-" + String.format("%04d", payoutRepository.count() + 1));
            payout.setVendorId(vendorId);
            payout.setVendorName(vendorName);
            payout.setGrossAmount(grossAmount);
            payout.setMethod(method);
            payout.setStatus("pending");
            payout.setDate(java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            payout.setPeriod(period);

            Payout saved = payoutRepository.save(payout);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/payouts")
    public ResponseEntity<?> updatePayout(@RequestBody Map<String, Object> request) {
        try {
            Long id = Long.valueOf(request.get("id").toString());
            Payout payout = payoutRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payout not found"));

            if (request.containsKey("status")) {
                payout.setStatus(request.get("status").toString());
            }
            if (request.containsKey("notes")) {
                payout.setNotes(request.get("notes").toString());
            }

            return ResponseEntity.ok(payoutRepository.save(payout));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Onboarding Steps ──
    @GetMapping("/onboarding-steps")
    public ResponseEntity<?> getOnboardingSteps() {
        try {
            return ResponseEntity.ok(vendorAdminService.getAllOnboardingSteps());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/onboarding-steps")
    public ResponseEntity<?> createOnboardingStep(@RequestBody OnboardingStep step) {
        try {
            return ResponseEntity.ok(vendorAdminService.saveOnboardingStep(step));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Vendor Onboarding Progress ──
    @GetMapping("/onboarding/{vendorId}")
    public ResponseEntity<?> getVendorOnboarding(@PathVariable Long vendorId) {
        try {
            return ResponseEntity.ok(vendorAdminService.getVendorOnboarding(vendorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/onboarding")
    public ResponseEntity<?> saveVendorOnboarding(@RequestBody List<VendorOnboarding> list) {
        try {
            return ResponseEntity.ok(vendorAdminService.saveAllVendorOnboarding(list));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Vendor Performance ──
    @GetMapping("/performance")
    public ResponseEntity<?> getPerformance() {
        try {
            return ResponseEntity.ok(vendorAdminService.getAllPerformance());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/performance")
    public ResponseEntity<?> updatePerformance(@RequestBody VendorPerformance perf) {
        try {
            return ResponseEntity.ok(vendorAdminService.savePerformance(perf));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Vendor Activities ──
    @GetMapping("/activities")
    public ResponseEntity<?> getActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        try {
            Page<VendorActivity> activities = vendorActivityService.getActivities(page, size, search);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{vendorId}/activities")
    public ResponseEntity<?> getVendorActivities(
            @PathVariable Long vendorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<VendorActivity> activities = vendorActivityService.getVendorActivities(vendorId, page, size);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Helper Methods ──

    private Map<String, Object> enrichKycRecord(VendorKYC k) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", k.getId());
        m.put("vendorId", k.getVendorId());
        m.put("vendorName", k.getVendorName());
        m.put("pan", k.getPan());
        m.put("gst", k.getGst());
        m.put("aadhaar", k.getAadhaar());
        m.put("address", k.getAddress());
        m.put("selfie", k.getSelfie());
        m.put("overall", k.getOverall());
        m.put("updated", k.getUpdated());

        // Derive status fields from actual values
        m.put("panStatus", k.getPan() != null && !"Not Started".equals(k.getPan()) && !"Pending".equals(k.getPan()) ? "verified" : "pending");
        m.put("gstStatus", k.getGst() != null && !"Not Started".equals(k.getGst()) && !"Pending".equals(k.getGst()) ? "verified" : "pending");
        m.put("aadhaarStatus", k.getAadhaar() != null && !"Not Started".equals(k.getAadhaar()) ? "verified" : "pending");
        m.put("addressStatus", k.getAddress() != null && !"Not Started".equals(k.getAddress()) ? "verified" : "pending");
        m.put("bankStatus", k.getBank() != null && !k.getBank().isEmpty() && k.getBank().contains("Pending||") ? "pending" : (k.getBank() != null && !k.getBank().isEmpty() ? "verified" : "missing"));

        // Use structured payment fields (preferred over pipe-delimited parsing)
        Map<String, Object> paymentInfo = new LinkedHashMap<>();
        paymentInfo.put("paymentMethod", k.getPaymentMethod());
        paymentInfo.put("beneficiaryName", k.getBeneficiaryName());
        paymentInfo.put("accountNumber", k.getAccountNumber());
        paymentInfo.put("ifscCode", k.getIfscCode());
        paymentInfo.put("upiId", k.getUpiId());
        paymentInfo.put("paypalEmail", k.getPaypalEmail());
        paymentInfo.put("bankName", k.getBankName());
        paymentInfo.put("panNumber", k.getPanNumber());
        paymentInfo.put("remittanceEmail", k.getRemittanceEmail());

        // Fallback: parse pipe-delimited bank field for backward compatibility with old records
        if (k.getBank() != null && !k.getBank().isEmpty() && k.getPaymentMethod() == null) {
            String[] parts = k.getBank().split("\\|\\|");
            if (parts.length >= 2) {
                paymentInfo.put("bankStatus", parts[0]);
                String method = parts.length > 1 ? parts[1] : "";
                paymentInfo.put("paymentMethod", method);
                if ("bank".equals(method) && parts.length >= 6) {
                    if (k.getBeneficiaryName() == null) paymentInfo.put("beneficiaryName", parts[2]);
                    if (k.getAccountNumber() == null) paymentInfo.put("accountNumber", parts.length > 3 ? parts[3] : "");
                    paymentInfo.put("accountType", parts.length > 4 ? parts[4] : "");
                    if (k.getIfscCode() == null) paymentInfo.put("ifscCode", parts.length > 5 ? parts[5] : "");
                    if (k.getRemittanceEmail() == null) paymentInfo.put("remittanceEmail", parts.length > 6 ? parts[6] : "");
                } else if ("upi".equals(method) && parts.length >= 6) {
                    if (k.getUpiId() == null) paymentInfo.put("upiId", parts[2]);
                    if (k.getBankName() == null) paymentInfo.put("bankName", parts[3]);
                    if (k.getPanNumber() == null) paymentInfo.put("panNumber", parts[4]);
                    if (k.getRemittanceEmail() == null) paymentInfo.put("remittanceEmail", parts[5]);
                } else if ("paypal".equals(method) && parts.length >= 6) {
                    if (k.getPaypalEmail() == null) paymentInfo.put("paypalEmail", parts[2]);
                    paymentInfo.put("legalName", parts[3]);
                    if (k.getPanNumber() == null) paymentInfo.put("panNumber", parts[4]);
                    paymentInfo.put("purposeCode", parts[5]);
                }
            }
        }
        m.put("paymentInfo", paymentInfo);
        m.put("bank", k.getBank());

        return m;
    }

    private String maskField(String value) {
        if (value == null || value.length() < 4) return value;
        return value.substring(0, Math.min(4, value.length())) + "****";
    }
}
