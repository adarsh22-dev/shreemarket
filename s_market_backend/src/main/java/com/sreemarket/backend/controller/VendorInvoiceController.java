package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.service.InvoiceService;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/vendor")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorInvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private OrderRepository orderRepository;

    /**
     * GET /api/vendor/invoices - List all orders that have invoices for this vendor.
     */
    @GetMapping("/invoices")
    public ResponseEntity<?> getVendorInvoices(HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        List<Order> vendorOrders = orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);
        List<Map<String, Object>> invoiceList = vendorOrders.stream()
                .filter(order -> order.getStatus() != null &&
                        (order.getStatus().equalsIgnoreCase("DELIVERED") ||
                         order.getStatus().equalsIgnoreCase("SHIPPED") ||
                         order.getStatus().equalsIgnoreCase("PROCESSING") ||
                         order.getStatus().equalsIgnoreCase("RETURNED")))
                .map(order -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("orderId", order.getId());
                    item.put("orderNumber", order.getOrderNumber() != null ? order.getOrderNumber() : "#" + order.getId());
                    item.put("customerName", order.getCustomerName() != null ? order.getCustomerName() : "N/A");
                    item.put("datePlaced", order.getDatePlaced());
                    item.put("totalAmount", order.getTotalAmount());
                    item.put("status", order.getStatus());
                    item.put("paymentMethod", order.getPaymentMethod());
                    return item;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(invoiceList);
    }

    /**
     * GET /api/vendor/orders/{orderId}/invoice - Download vendor-branded invoice HTML.
     */
    @GetMapping("/orders/{orderId}/invoice")
    public ResponseEntity<?> downloadVendorInvoice(@PathVariable Long orderId, HttpServletRequest request) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        // Verify the order belongs to this vendor
        Order order = orderRepository.findById(orderId)
                .orElse(null);
        if (order == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Order not found"));
        }
        if (!vendorId.equals(order.getVendorId())) {
            return ResponseEntity.status(403).body(Map.of("error", "This order does not belong to your store"));
        }

        try {
            String html = invoiceService.generateVendorInvoiceHtml(orderId, vendorId);
            byte[] bytes = html.getBytes("UTF-8");
            String filename = "invoice_" + (order.getOrderNumber() != null ? order.getOrderNumber() : orderId) + ".html";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.TEXT_HTML)
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to generate invoice: " + e.getMessage()));
        }
    }
}
