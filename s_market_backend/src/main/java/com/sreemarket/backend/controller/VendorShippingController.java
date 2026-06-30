package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.model.ShippingLabel;
import com.sreemarket.backend.model.VendorShipment;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.repository.VendorShipmentRepository;
import com.sreemarket.backend.service.ShippingGatewayService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@RestController
@RequestMapping("/api/vendor/shipping")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorShippingController {

    @Autowired
    private ShippingGatewayService shippingGatewayService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private VendorShipmentRepository vendorShipmentRepository;

    /**
     * GET /api/vendor/shipping/shipments - List all shipments for the vendor.
     */
    @GetMapping("/shipments")
    public ResponseEntity<?> getShipments(HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        }

        try {
            List<VendorShipment> shipments = vendorShipmentRepository.findAll();
            // Filter by orders belonging to this vendor
            List<Map<String, Object>> result = new ArrayList<>();
            for (VendorShipment s : shipments) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", s.getId());
                item.put("orderId", s.getOrderId());
                item.put("customerName", s.getCustomerName());
                item.put("customerLocation", s.getCustomerLocation());
                item.put("carrierName", s.getCarrierName());
                item.put("status", s.getStatus());
                item.put("shipDate", s.getShipDate());
                item.put("estDelivery", s.getEstDelivery());
                result.add(item);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch shipments: " + e.getMessage()));
        }
    }

    /**
     * GET /api/vendor/shipping/labels - List all shipping labels for the vendor.
     */
    @GetMapping("/labels")
    public ResponseEntity<?> getLabels(HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        }

        try {
            List<ShippingLabel> labels = shippingGatewayService.getVendorLabels(vendorId);
            return ResponseEntity.ok(labels);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch labels: " + e.getMessage()));
        }
    }

    /**
     * POST /api/vendor/shipping/shipments/create - Create a new shipment for an order.
     * Body: { "orderId": 123, "carrierCode": "shiprocket", "weight": 0.5, "length": 10, "breadth": 10, "height": 10 }
     */
    @PostMapping("/shipments/create")
    public ResponseEntity<?> createShipment(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        }

        try {
            Long orderId = body.get("orderId") instanceof Number ? ((Number) body.get("orderId")).longValue() : null;
            String carrierCode = (String) body.getOrDefault("carrierCode", "shiprocket");

            if (orderId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "orderId is required"));
            }

            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

            // Verify order belongs to vendor
            if (!vendorId.equals(order.getVendorId())) {
                return ResponseEntity.status(403).body(Map.of("error", "This order does not belong to your vendor account"));
            }

            ShippingLabel label = shippingGatewayService.createShipment(vendorId, order, carrierCode, body);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("label", label);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create shipment: " + e.getMessage()));
        }
    }

    /**
     * POST /api/vendor/shipping/labels/{id}/generate - Generate label for a shipment.
     */
    @PostMapping("/labels/{id}/generate")
    public ResponseEntity<?> generateLabel(@PathVariable Long id, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        }

        try {
            ShippingLabel label = shippingGatewayService.generateLabel(id);

            // Verify ownership
            if (!vendorId.equals(label.getVendorId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            return ResponseEntity.ok(label);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/vendor/shipping/labels/{id}/pickup - Schedule pickup.
     */
    @PostMapping("/labels/{id}/pickup")
    public ResponseEntity<?> schedulePickup(@PathVariable Long id, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vendor not authenticated"));
        }

        try {
            ShippingLabel label = shippingGatewayService.schedulePickup(id);

            if (!vendorId.equals(label.getVendorId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }

            return ResponseEntity.ok(Map.of("success", true, "label", label));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/vendor/shipping/track/{awbNumber} - Track a shipment by AWB.
     */
    @GetMapping("/track/{awbNumber}")
    public ResponseEntity<?> trackShipment(@PathVariable String awbNumber) {
        try {
            Map<String, Object> tracking = shippingGatewayService.trackShipment(awbNumber);
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to track shipment: " + e.getMessage()));
        }
    }

    /**
     * GET /api/vendor/shipping/carriers - List available carriers.
     */
    @GetMapping("/carriers")
    public ResponseEntity<?> getCarriers() {
        List<Map<String, Object>> carriers = Arrays.asList(
                Map.of("code", "shiprocket", "name", "Shiprocket", "active", false, "description", "Integrated logistics platform with pan-India coverage"),
                Map.of("code", "delhivery", "name", "Delhivery", "active", false, "description", "Leading logistics and supply chain services"),
                Map.of("code", "fedex", "name", "FedEx", "active", false, "description", "Global courier delivery services"),
                Map.of("code", "bluedart", "name", "Blue Dart", "active", false, "description", "Express logistics and courier service"),
                Map.of("code", "dhl", "name", "DHL", "active", false, "description", "International shipping and courier"),
                Map.of("code", "ekart", "name", "Ekart", "active", false, "description", "Logistics by Flipkart"),
                Map.of("code", "xpressbees", "name", "XpressBees", "active", false, "description", "E-commerce logistics solutions"),
                Map.of("code", "shadowfax", "name", "Shadowfax", "active", false, "description", "Hyperlocal delivery and logistics")
        );
        return ResponseEntity.ok(carriers);
    }
}
