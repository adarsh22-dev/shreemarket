package com.sreemarket.backend.service;

import com.sreemarket.backend.dto.PincodeValidationResponse;
import com.sreemarket.backend.dto.PincodeValidationResponse.CourierOption;
import com.sreemarket.backend.dto.PincodeValidationResponse.VendorShippingStatus;
import com.sreemarket.backend.model.*;
import com.sreemarket.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core service for pincode-based shipping availability validation.
 *
 * Flow:
 * 1. Customer enters delivery pincode.
 * 2. System finds the vendor's origin pincode (from Store entity).
 * 3. Checks in-memory / DB cache first.
 * 4. If cache miss, queries PincodeCoverage table (populated from shipping partners).
 * 5. Falls back to external shipping provider API if needed.
 * 6. Returns serviceability, courier options, estimated delivery, and charges.
 *
 * Multi-vendor carts: validates each vendor's origin → destination independently.
 */
@Service
public class PincodeValidationService {

    @Autowired
    private PincodeCoverageRepository pincodeCoverageRepository;

    @Autowired
    private PincodeServiceabilityRepository pincodeServiceabilityRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private DeliveryPartnerRepository deliveryPartnerRepository;

    @Autowired
    private VendorShippingRuleRepository vendorShippingRuleRepository;

    @Autowired
    private ShippingZoneRepository shippingZoneRepository;

    // ── Configuration ──

    @Value("${shipping.cache.ttl-minutes:60}")
    private int cacheTtlMinutes;

    @Value("${shipping.default-charge:50}")
    private double defaultShippingCharge;

    /** Known blocked pincodes (conflict zones, restricted areas) */
    @Value("${shipping.blocked-pincodes:}")
    private String blockedPincodesConfig;

    /**
     * Pincode prefixes considered remote/unserviceable.
     * Default: Indian Army Postal Service (APS) areas (pincodes starting with "9").
     * Configurable via shipping.remote-pincode-prefixes in application.properties.
     */
    @Value("${shipping.remote-pincode-prefixes:91,92,93,94,95,96,97,98,99}")
    private String remotePrefixesConfig;

    private List<String> remotePrefixes;

    /**
     * Lazy-init the remote prefixes list after the @Value is injected.
     */
    private List<String> getRemotePrefixes() {
        if (remotePrefixes == null) {
            if (remotePrefixesConfig != null && !remotePrefixesConfig.isEmpty()) {
                remotePrefixes = Arrays.stream(remotePrefixesConfig.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(java.util.stream.Collectors.toList());
            } else {
                remotePrefixes = java.util.Collections.emptyList();
            }
        }
        return remotePrefixes;
    }

    /** Pincode format validation regex */
    private static final String PINCODE_REGEX = "^[1-9][0-9]{5}$";

    private static final DateTimeFormatter DATE_FORMATTER =
        DateTimeFormatter.ofPattern("MMM dd").withZone(ZoneId.of("Asia/Kolkata"));

    // ════════════════════════════════════════════════════════════════
    //  PUBLIC API
    // ════════════════════════════════════════════════════════════════

    /**
     * Validate shipping availability from a single vendor to a customer pincode.
     *
     * The system checks three pillars:
     *   1. Customer's destination pincode — is it valid, blocked, remote?
     *   2. Vendor's origin pincode — is the vendor in a valid, serviceable area?
     *   3. Shipper (courier) coverage — do any couriers serve the route?
     *
     * @param vendorId        The vendor shipping the product
     * @param destinationPincode Customer's delivery pincode
     * @return Validation response with courier options, EDD, and charges
     */
    public PincodeValidationResponse validateSingleVendor(
            Long vendorId, String destinationPincode) {

        // ═══════════════════════════════════════════
        // 1. Validate CUSTOMER's pincode
        // ═══════════════════════════════════════════
        // Format (6 digits, first digit 1-9)
        PincodeValidationResponse customerPincodeErr = validatePincodeFormat(destinationPincode);
        if (customerPincodeErr != null) return customerPincodeErr;

        // Blocked (conflict zones, restricted areas)
        PincodeValidationResponse customerBlockedErr = checkBlockedPincode(destinationPincode);
        if (customerBlockedErr != null) return customerBlockedErr;

        // ═══════════════════════════════════════════
        // 2. Validate VENDOR's origin pincode
        // ═══════════════════════════════════════════
        String originPincode = getVendorOriginPincode(vendorId);
        if (originPincode == null || originPincode.trim().isEmpty()) {
            return errorResponse(destinationPincode,
                "Vendor has not configured their shipping location. Please contact support.");
        }

        // Vendor pincode format must be valid
        PincodeValidationResponse vendorPincodeErr = validatePincodeFormat(originPincode);
        if (vendorPincodeErr != null) {
            return errorResponse(destinationPincode,
                "Vendor's shipping location pincode is invalid. Please contact the vendor.");
        }

        // Vendor pincode must not be blocked
        PincodeValidationResponse vendorBlockedErr = checkBlockedPincode(originPincode);
        if (vendorBlockedErr != null) {
            return errorResponse(destinationPincode,
                "Vendor is located in a restricted area and cannot ship from this location.");
        }

        // ═══════════════════════════════════════════
        // 3. Check if same pincode (local delivery)
        // ═══════════════════════════════════════════
        if (originPincode.equals(destinationPincode)) {
            PincodeValidationResponse response = new PincodeValidationResponse(true,
                "Delivery available to your location — local pickup/same-day.");
            response.setDestinationPincode(destinationPincode);
            response.setShippingCharges(0.0);
            CourierOption local = new CourierOption("local", "Local Delivery", 0, 1, 0.0, true);
            response.setCourierOptions(Collections.singletonList(local));
            response.setEstimatedDelivery(formatDateRange(0, 1));
            return response;
        }

        // ═══════════════════════════════════════════
        // 4. Check Shipping Zones FIRST (before cache, so newly created
        //    zones take effect immediately, even if stale cache exists)
        // ═══════════════════════════════════════════
        PincodeValidationResponse zoneCheck = checkShippingZones(destinationPincode, vendorId);
        if (zoneCheck != null) {
            cacheResult(originPincode, destinationPincode, zoneCheck);
            return zoneCheck;
        }

        // ═══════════════════════════════════════════
        // 5. Check cache (origin → destination route)
        // ═══════════════════════════════════════════
        PincodeValidationResponse cached = checkCache(originPincode, destinationPincode);
        if (cached != null) return cached;

        // ═══════════════════════════════════════════
        // 6. Query SHIPPER (courier) coverage
        // ═══════════════════════════════════════════
        PincodeValidationResponse response = checkCoverage(originPincode, destinationPincode, vendorId);

        // ═══════════════════════════════════════════
        // 7. Cache the result
        // ═══════════════════════════════════════════
        cacheResult(originPincode, destinationPincode, response);

        return response;
    }

    /**
     * Validate shipping for a multi-vendor cart.
     * Each vendor's products are checked independently against the destination pincode.
     *
     * @param productIds       List of product IDs in the cart
     * @param destinationPincode Customer's delivery pincode
     * @return Aggregated response with per-vendor breakdown
     */
    public PincodeValidationResponse validateCart(
            List<Long> productIds, String destinationPincode) {

        // 1. Validate pincode format
        PincodeValidationResponse formatError = validatePincodeFormat(destinationPincode);
        if (formatError != null) return formatError;

        PincodeValidationResponse blockedError = checkBlockedPincode(destinationPincode);
        if (blockedError != null) return blockedError;

        // 2. Group products by vendor
        List<Product> products = productRepository.findAllById(productIds);
        Map<Long, List<Long>> vendorProductMap = new LinkedHashMap<>();
        for (Product p : products) {
            vendorProductMap
                .computeIfAbsent(p.getVendorId(), k -> new ArrayList<>())
                .add(p.getId());
        }

        if (vendorProductMap.isEmpty()) {
            return errorResponse(destinationPincode, "No valid products found in cart.");
        }

        // 3. Validate each vendor independently
        List<VendorShippingStatus> vendorStatuses = new ArrayList<>();
        boolean allServiceable = true;
        double totalShipping = 0.0;
        String overallEstimatedDelivery = null;

        for (Map.Entry<Long, List<Long>> entry : vendorProductMap.entrySet()) {
            Long vendorId = entry.getKey();
            List<Long> vendorProductIds = entry.getValue();

            // Get vendor name and pincode
            String originPincode = getVendorOriginPincode(vendorId);
            String vendorName = getVendorName(vendorId);

            VendorShippingStatus vs = new VendorShippingStatus();
            vs.setVendorId(vendorId);
            vs.setVendorName(vendorName);
            vs.setVendorPincode(originPincode != null ? originPincode : "Not set");
            vs.setProductIds(vendorProductIds);

            if (originPincode == null) {
                vs.setServiceable(false);
                vs.setMessage("Delivery not available for this pincode — vendor location not configured.");
                allServiceable = false;
                vendorStatuses.add(vs);
                continue;
            }

            // Validate this vendor's origin → destination
            PincodeValidationResponse vendorResult =
                validateSingleVendor(vendorId, destinationPincode);

            vs.setServiceable(vendorResult.isServiceable());
            vs.setMessage(vendorResult.getMessage());
            vs.setShippingCharges(vendorResult.getShippingCharges());
            vs.setEstimatedDelivery(vendorResult.getEstimatedDelivery());
            vs.setCourierOptions(vendorResult.getCourierOptions());

            if (!vendorResult.isServiceable()) {
                allServiceable = false;
            } else {
                totalShipping += (vendorResult.getShippingCharges() != null
                    ? vendorResult.getShippingCharges() : 0.0);
                if (vendorResult.getEstimatedDelivery() != null) {
                    overallEstimatedDelivery = vendorResult.getEstimatedDelivery();
                }
            }

            vendorStatuses.add(vs);
        }

        // 4. Build aggregate response
        PincodeValidationResponse aggregate = new PincodeValidationResponse();
        aggregate.setDestinationPincode(destinationPincode);
        aggregate.setVendorBreakdown(vendorStatuses);
        aggregate.setShippingCharges(totalShipping);
        aggregate.setEstimatedDelivery(overallEstimatedDelivery);

        boolean hasSomeDeliverable = vendorStatuses.stream().anyMatch(VendorShippingStatus::isServiceable);

        if (allServiceable) {
            aggregate.setServiceable(true);
            aggregate.setMessage("Delivery available to your location.");
            aggregate.setReason(null);
        } else if (hasSomeDeliverable) {
            aggregate.setServiceable(false);
            aggregate.setMessage("Some items in your cart are not serviceable.");
            aggregate.setReason("Some vendors cannot deliver to your pincode.");
        } else {
            aggregate.setServiceable(false);
            aggregate.setMessage("Delivery not available for this pincode.");
            aggregate.setReason("None of the vendors in your cart can deliver to this location.");
        }

        return aggregate;
    }

    /**
     * Quick single-pincode check (used during checkout pincode entry).
     * Returns only whether ANY courier services this pincode.
     */
    public PincodeValidationResponse quickCheck(String pincode) {
        PincodeValidationResponse formatError = validatePincodeFormat(pincode);
        if (formatError != null) return formatError;

        PincodeValidationResponse blockedError = checkBlockedPincode(pincode);
        if (blockedError != null) return blockedError;

        List<PincodeCoverage> coverages = pincodeCoverageRepository.findActiveByPincode(pincode);
        if (!coverages.isEmpty()) {
            PincodeValidationResponse ok = new PincodeValidationResponse(true,
                "Delivery available to your location.");
            ok.setDestinationPincode(pincode);
            return ok;
        }

        // Check if any courier partner explicitly covers this pincode
        List<DeliveryPartner> partners = deliveryPartnerRepository.findByStatus("active");
        for (DeliveryPartner partner : partners) {
            String coverage = partner.getCoverage();
            if (coverage != null && coverage.contains(pincode)) {
                PincodeValidationResponse ok = new PincodeValidationResponse(true,
                    "Delivery available to your location.");
                ok.setDestinationPincode(pincode);
                return ok;
            }
        }

        // Check if any active ShippingZone covers this pincode
        List<ShippingZone> activeZones = shippingZoneRepository.findByIsActiveTrue();
        for (ShippingZone zone : activeZones) {
            String zonePincodes = zone.getPincodes();
            if (zonePincodes == null || zonePincodes.trim().isEmpty()) {
                // Zone with no pincode restrictions = applies to all
                if (zone.getRegions() == null || zone.getRegions().trim().isEmpty()) {
                    PincodeValidationResponse ok = new PincodeValidationResponse(true,
                        "Delivery available to your location.");
                    ok.setDestinationPincode(pincode);
                    return ok;
                }
                continue;
            }
            String[] pincodeList = zonePincodes.split("[,\\n\\r]+");
            for (String p : pincodeList) {
                if (p.trim().equals(pincode.trim())) {
                    PincodeValidationResponse ok = new PincodeValidationResponse(true,
                        "Delivery available to your location.");
                    ok.setDestinationPincode(pincode);
                    return ok;
                }
            }
        }

        return errorResponse(pincode, "Delivery not available for this pincode.");
    }

    /**
     * Admin: Force refresh cache for a pincode
     */
    public void clearCacheForPincode(String pincode) {
        List<PincodeServiceability> cached =
            pincodeServiceabilityRepository.findByDestinationPincode(pincode);
        pincodeServiceabilityRepository.deleteAll(cached);
    }

    /**
     * Admin: Clean up all expired cache entries
     */
    public int purgeExpiredCache() {
        return pincodeServiceabilityRepository.deleteExpired(System.currentTimeMillis());
    }

    /**
     * Auto-purge expired cache entries every hour.
     * Enabled by @EnableScheduling on the application class.
     */
    @Scheduled(fixedRate = 3600000)
    public void scheduledPurgeExpired() {
        int purged = purgeExpiredCache();
        if (purged > 0) {
            System.out.println("Purged " + purged + " expired pincode cache entries.");
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ════════════════════════════════════════════════════════════════

    /**
     * Validates Indian pincode format (6 digits, first digit 1-9).
     */
    private PincodeValidationResponse validatePincodeFormat(String pincode) {
        if (pincode == null || pincode.trim().isEmpty()) {
            return errorResponse(pincode, "Please enter a delivery pincode.");
        }
        String cleaned = pincode.trim();
        if (!cleaned.matches(PINCODE_REGEX)) {
            return errorResponse(cleaned, "Please enter a valid 6-digit Indian pincode.");
        }
        // Check for remote area prefixes (configurable via shipping.remote-pincode-prefixes)
        for (String prefix : getRemotePrefixes()) {
            if (cleaned.startsWith(prefix)) {
                return errorResponse(cleaned,
                    "Delivery not available for this pincode — remote area.");
            }
        }
        return null;
    }

    /**
     * Check if a pincode is blocked (conflict zones, restricted areas).
     */
    private PincodeValidationResponse checkBlockedPincode(String pincode) {
        // Check DB-based blocked list
        List<PincodeCoverage> blocked = pincodeCoverageRepository.findBlockedByPincode(pincode);
        if (!blocked.isEmpty()) {
            String reason = blocked.get(0).getBlockReason();
            return errorResponse(pincode,
                reason != null ? reason : "Delivery not available for this pincode — restricted location.");
        }

        // Check configured blocked pincodes (from property file)
        if (blockedPincodesConfig != null && !blockedPincodesConfig.isEmpty()) {
            Set<String> blockedSet = Arrays.stream(blockedPincodesConfig.split(","))
                .map(String::trim)
                .collect(Collectors.toSet());
            if (blockedSet.contains(pincode)) {
                return errorResponse(pincode,
                    "Delivery not available for this pincode — restricted location.");
            }
        }

        return null;
    }

    /**
     * Get the vendor's origin pincode from their primary store.
     */
    private String getVendorOriginPincode(Long vendorId) {
        List<Store> stores = storeRepository.findByVendorId(vendorId);
        if (stores != null && !stores.isEmpty()) {
            // Primary store is typically the first one
            return stores.get(0).getPincode();
        }
        return null;
    }

    /**
     * Get the vendor's display name.
     */
    private String getVendorName(Long vendorId) {
        List<Store> stores = storeRepository.findByVendorId(vendorId);
        if (stores != null && !stores.isEmpty()) {
            String name = stores.get(0).getStoreName();
            if (name != null && !name.isEmpty()) return name;
        }
        return "Vendor #" + vendorId;
    }

    /**
     * Check the database cache for a recent validation result.
     */
    private PincodeValidationResponse checkCache(String origin, String destination) {
        Optional<PincodeServiceability> cached =
            pincodeServiceabilityRepository.findByOriginPincodeAndDestinationPincodeAndExpiresAtGreaterThan(
                origin, destination, System.currentTimeMillis());

        if (cached.isPresent()) {
            PincodeServiceability cs = cached.get();
            return buildFromCache(cs);
        }
        return null;
    }

    /**
     * Convert a cache entity back to a response DTO.
     */
    private PincodeValidationResponse buildFromCache(PincodeServiceability cs) {
        PincodeValidationResponse response = new PincodeValidationResponse();
        response.setDestinationPincode(cs.getDestinationPincode());
        response.setServiceable(cs.getServiceable());
        response.setShippingCharges(cs.getShippingCharge());
        response.setEstimatedDelivery(formatDateRange(
            cs.getEstimatedDaysMin(), cs.getEstimatedDaysMax()));
        response.setReason(cs.getReason());
        response.setMessage(cs.getServiceable()
            ? "Delivery available to your location."
            : "Delivery not available for this pincode.");

        if (cs.getServiceable()) {
            CourierOption co = new CourierOption(
                cs.getCourierCode(),
                cs.getCourierName() != null ? cs.getCourierName() : cs.getCourierCode(),
                cs.getEstimatedDaysMin(),
                cs.getEstimatedDaysMax(),
                cs.getShippingCharge(),
                !Boolean.TRUE.equals(cs.getIsBlocked())
            );
            response.setCourierOptions(Collections.singletonList(co));
        }

        return response;
    }

    /**
     * Query the PincodeCoverage table for available couriers between origin and destination.
     */
    private PincodeValidationResponse checkCoverage(
            String originPincode, String destinationPincode, Long vendorId) {

        List<PincodeCoverage> coverages =
            pincodeCoverageRepository.findActiveByPincode(destinationPincode);

        if (coverages.isEmpty()) {
            // Fallback to vendor's custom shipping rules
            return checkVendorShippingRules(originPincode, destinationPincode, vendorId);
        }

        // Filter to couriers that likely serve this route
        // (In production, Shiprocket/Delhivery APIs would be called here)
        List<CourierOption> options = new ArrayList<>();
        Double minCharge = Double.MAX_VALUE;
        int minDays = Integer.MAX_VALUE;
        int maxDays = 0;

        for (PincodeCoverage pc : coverages) {
            CourierOption option = new CourierOption(
                pc.getCourierCode(),
                pc.getCourierName() != null ? pc.getCourierName() : pc.getCourierCode(),
                pc.getEstimatedDaysMin(),
                pc.getEstimatedDaysMax(),
                pc.getBaseCharge(),
                pc.getCodAvailable()
            );
            options.add(option);

            if (pc.getBaseCharge() != null && pc.getBaseCharge() < minCharge) {
                minCharge = pc.getBaseCharge();
            }
            if (pc.getEstimatedDaysMin() != null && pc.getEstimatedDaysMin() < minDays) {
                minDays = pc.getEstimatedDaysMin();
            }
            if (pc.getEstimatedDaysMax() != null && pc.getEstimatedDaysMax() > maxDays) {
                maxDays = pc.getEstimatedDaysMax();
            }
        }

        // Apply vendor-specific shipping rules for charge calculation
        Double finalCharge = applyVendorShippingCharge(vendorId, destinationPincode, minCharge);

        PincodeValidationResponse response = new PincodeValidationResponse(true,
            "Delivery available to your location.");
        response.setDestinationPincode(destinationPincode);
        response.setCourierOptions(options);
        response.setShippingCharges(finalCharge);
        response.setEstimatedDelivery(formatDateRange(minDays, maxDays));
        return response;
    }

    /**
     * Check if the destination pincode matches any active ShippingZone.
     * Returns a valid response if a matching zone is found, null otherwise.
     */
    private PincodeValidationResponse checkShippingZones(
            String destinationPincode, @SuppressWarnings("unused") Long vendorId) {

        List<ShippingZone> activeZones = shippingZoneRepository.findByIsActiveTrue();
        if (activeZones.isEmpty()) {
            return null;
        }

        for (ShippingZone zone : activeZones) {
            String zonePincodes = zone.getPincodes();
            if (zonePincodes == null || zonePincodes.trim().isEmpty()) {
                // Zone with no specific pincodes = applies to all pincodes in its regions
                // Check if regions match (if specified)
                String regions = zone.getRegions();
                if (regions != null && !regions.trim().isEmpty()) {
                    // Regions are comma-separated; we can't reliably match without
                    // knowing the customer's region, so skip zone-level check for regions-only zones
                    continue;
                }
                // No pincodes AND no regions = zone applies to all locations
                return buildZoneResponse(zone, destinationPincode);
            }

            // Check if destination pincode is in the zone's pincode list
            String[] pincodeList = zonePincodes.split("[,\\n\\r]+");
            for (String p : pincodeList) {
                if (p.trim().equals(destinationPincode.trim())) {
                    return buildZoneResponse(zone, destinationPincode);
                }
            }
        }

        return null;
    }

    /**
     * Build a validation response from a matching ShippingZone.
     */
    private PincodeValidationResponse buildZoneResponse(ShippingZone zone, String destinationPincode) {
        Double charge = zone.getBaseRate() != null ? zone.getBaseRate() : defaultShippingCharge;

        PincodeValidationResponse response = new PincodeValidationResponse(true,
            "Delivery available to your location.");
        response.setDestinationPincode(destinationPincode);
        response.setShippingCharges(charge);
        response.setEstimatedDelivery(formatDateRange(
            zone.getEstimatedDaysMin(), zone.getEstimatedDaysMax()));

        CourierOption option = new CourierOption(
            zone.getDeliveryType() != null ? zone.getDeliveryType() : "STANDARD",
            zone.getName(),
            zone.getEstimatedDaysMin(), zone.getEstimatedDaysMax(),
            charge, true
        );
        response.setCourierOptions(Collections.singletonList(option));
        return response;
    }

    /**
     * Fallback: Check vendor's custom shipping rules when courier coverage is unknown.
     */
    private PincodeValidationResponse checkVendorShippingRules(
            String originPincode, String destinationPincode, Long vendorId) {

        List<VendorShippingRule> rules =
            vendorShippingRuleRepository.findByVendorIdAndIsActiveTrueOrderBySortOrderAsc(vendorId);

        if (rules.isEmpty()) {
            return errorResponse(destinationPincode,
                "Delivery not available for this pincode — no courier services this area.");
        }

        for (VendorShippingRule rule : rules) {
            // Check if this rule applies to the destination pincode
            String applicablePincodes = rule.getApplicablePincodes();
            if (applicablePincodes != null && !applicablePincodes.isEmpty()) {
                try {
                    @SuppressWarnings("unchecked")
                    List<String> pincodeList = new com.fasterxml.jackson.databind.ObjectMapper()
                        .readValue(applicablePincodes, List.class);
                    if (!pincodeList.contains(destinationPincode)) {
                        continue; // This rule doesn't apply
                    }
                } catch (Exception e) {
                    continue;
                }
            }

            // Calculate charge based on rule type
            Double charge = calculateRuleCharge(rule);

            PincodeValidationResponse response = new PincodeValidationResponse(true,
                "Delivery available to your location.");
            response.setDestinationPincode(destinationPincode);
            response.setShippingCharges(charge);
            response.setEstimatedDelivery(formatDateRange(
                rule.getEstimatedDaysMin(), rule.getEstimatedDaysMax()));

            CourierOption option = new CourierOption(
                rule.getRuleType(), rule.getName(),
                rule.getEstimatedDaysMin(), rule.getEstimatedDaysMax(),
                charge, true
            );
            response.setCourierOptions(Collections.singletonList(option));
            return response;
        }

        return errorResponse(destinationPincode,
            "Delivery not available for this pincode — no applicable shipping rule found.");
    }

    /**
     * Apply vendor's shipping charge on top of calculated base charge.
     */
    private Double applyVendorShippingCharge(
            Long vendorId, String destinationPincode, Double baseCharge) {

        List<VendorShippingRule> rules =
            vendorShippingRuleRepository.findByVendorIdAndIsActiveTrueOrderBySortOrderAsc(vendorId);

        if (rules.isEmpty()) {
            return baseCharge < Double.MAX_VALUE ? baseCharge : defaultShippingCharge;
        }

        // Use the first matching rule's charge
        for (VendorShippingRule rule : rules) {
            String applicablePincodes = rule.getApplicablePincodes();
            if (applicablePincodes != null && !applicablePincodes.isEmpty()) {
                try {
                    @SuppressWarnings("unchecked")
                    List<String> pincodeList = new com.fasterxml.jackson.databind.ObjectMapper()
                        .readValue(applicablePincodes, List.class);
                    if (!pincodeList.contains(destinationPincode)) continue;
                } catch (Exception e) { continue; }
            }
            return calculateRuleCharge(rule);
        }

        return baseCharge < Double.MAX_VALUE ? baseCharge : defaultShippingCharge;
    }

    /**
     * Calculate shipping charge from a VendorShippingRule.
     */
    private Double calculateRuleCharge(VendorShippingRule rule) {
        switch (rule.getRuleType()) {
            case "free_shipping":
                return 0.0;
            case "flat_rate":
                return rule.getRate() != null ? rule.getRate() : defaultShippingCharge;
            case "per_product":
                return rule.getPerProductRate() != null
                    ? rule.getPerProductRate() : defaultShippingCharge;
            case "weight_based":
                return rule.getRatePerKg() != null
                    ? rule.getRatePerKg() : defaultShippingCharge;
            default:
                return rule.getRate() != null ? rule.getRate() : defaultShippingCharge;
        }
    }

    /**
     * Cache the validation result with TTL.
     */
    private void cacheResult(String originPincode, String destinationPincode,
                             PincodeValidationResponse response) {
        long now = System.currentTimeMillis();
        long expiresAt = now + (cacheTtlMinutes * 60 * 1000L);

        // Determine best courier option to cache
        CourierOption bestOption = null;
        if (response.getCourierOptions() != null && !response.getCourierOptions().isEmpty()) {
            bestOption = response.getCourierOptions().stream()
                .min(Comparator.comparingDouble(o ->
                    o.getCharge() != null ? o.getCharge() : Double.MAX_VALUE))
                .orElse(response.getCourierOptions().get(0));
        }

        PincodeServiceability cache = new PincodeServiceability();
        cache.setOriginPincode(originPincode);
        cache.setDestinationPincode(destinationPincode);
        cache.setServiceable(response.isServiceable());
        cache.setCachedAt(now);
        cache.setExpiresAt(expiresAt);
        cache.setReason(response.getReason());

        if (response.isServiceable() && bestOption != null) {
            cache.setCourierCode(bestOption.getCourierCode());
            cache.setCourierName(bestOption.getCourierName());
            cache.setEstimatedDaysMin(bestOption.getEstimatedDaysMin());
            cache.setEstimatedDaysMax(bestOption.getEstimatedDaysMax());
            cache.setShippingCharge(bestOption.getCharge());
        }

        try {
            pincodeServiceabilityRepository.save(cache);
        } catch (Exception e) {
            // Cache failure is non-critical; log and continue
            System.err.println("Failed to cache pincode validation: " + e.getMessage());
        }
    }

    // ── Utility ──

    /**
     * Format estimated delivery date range.
     * e.g., "Jun 28 - Jul 2"
     */
    private String formatDateRange(Integer minDays, Integer maxDays) {
        if (minDays == null) minDays = 3;
        if (maxDays == null) maxDays = 7;

        long now = System.currentTimeMillis();
        String start = DATE_FORMATTER.format(Instant.ofEpochMilli(now + (minDays * 86400000L)));
        String end = DATE_FORMATTER.format(Instant.ofEpochMilli(now + (maxDays * 86400000L)));

        if (start.equals(end)) return start;
        return start + " - " + end;
    }

    private static PincodeValidationResponse errorResponse(String pincode, String message) {
        PincodeValidationResponse response = new PincodeValidationResponse(false, message);
        response.setDestinationPincode(pincode);
        response.setReason(message);
        return response;
    }
}
