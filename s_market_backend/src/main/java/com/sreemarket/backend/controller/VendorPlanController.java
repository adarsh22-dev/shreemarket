package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.VendorPlan;
import com.sreemarket.backend.model.VendorSubscription;
import com.sreemarket.backend.repository.VendorPlanRepository;
import com.sreemarket.backend.repository.VendorSubscriptionRepository;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/vendor/plans")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorPlanController {

    @Autowired
    private VendorPlanRepository vendorPlanRepository;

    @Autowired
    private VendorSubscriptionRepository vendorSubscriptionRepository;

    @PostConstruct
    public void seedPlans() {
        if (vendorPlanRepository.count() == 0) {
            vendorPlanRepository.saveAll(Arrays.asList(
                createPlan("Free", "Basic store access with limited products", 0.0, 0.0, 10, 50, 5.0, false, false, false, false, false),
                createPlan("Starter", "For growing businesses", 499.0, 4999.0, 50, 200, 3.0, false, false, false, false, false),
                createPlan("Professional", "For established sellers", 999.0, 9999.0, 200, 1000, 2.0, true, true, true, false, false),
                createPlan("Enterprise", "For large-scale operations", 2499.0, 24999.0, 9999, 99999, 1.0, true, true, true, true, true)
            ));
        }
    }

    private VendorPlan createPlan(String name, String desc, double monthly, double yearly,
            int maxProd, int maxOrd, double comm, boolean featured, boolean support,
            boolean analytics, boolean storefront, boolean api) {
        VendorPlan p = new VendorPlan();
        p.setName(name);
        p.setDescription(desc);
        p.setMonthlyPrice(monthly);
        p.setYearlyPrice(yearly);
        p.setMaxProducts(maxProd);
        p.setMaxOrders(maxOrd);
        p.setCommissionRate(comm);
        p.setFeaturedListing(featured);
        p.setPrioritySupport(support);
        p.setAdvancedAnalytics(analytics);
        p.setCustomStorefront(storefront);
        p.setApiAccess(api);
        p.setActive(true);
        p.setCreatedAt(System.currentTimeMillis());
        return p;
    }

    @GetMapping
    public ResponseEntity<?> getPlans() {
        return ResponseEntity.ok(vendorPlanRepository.findByActiveTrue());
    }

    @GetMapping("/my-subscription")
    public ResponseEntity<?> getMySubscription(HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        Optional<VendorSubscription> sub = vendorSubscriptionRepository.findTopByVendorIdOrderByStartDateDesc(vendorId);
        return ResponseEntity.ok(sub.orElse(null));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        Long planId = body.get("planId") instanceof Number ? ((Number) body.get("planId")).longValue() : null;
        String billingCycle = (String) body.getOrDefault("billingCycle", "monthly");

        VendorPlan plan = vendorPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        VendorSubscription sub = new VendorSubscription();
        sub.setVendorId(vendorId);
        sub.setPlanId(planId);
        sub.setPlanName(plan.getName());
        sub.setBillingCycle(billingCycle);
        sub.setAmount("monthly".equalsIgnoreCase(billingCycle) ? plan.getMonthlyPrice() : plan.getYearlyPrice());
        sub.setStartDate(System.currentTimeMillis());
        sub.setEndDate(System.currentTimeMillis() + ("monthly".equalsIgnoreCase(billingCycle) ? 2592000000L : 31536000000L));
        sub.setStatus("ACTIVE");
        vendorSubscriptionRepository.save(sub);

        return ResponseEntity.ok(Map.of("success", true, "subscription", sub));
    }
}
