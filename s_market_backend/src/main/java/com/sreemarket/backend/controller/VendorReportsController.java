package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/vendor/reports")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorReportsController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/orders/csv")
    public void exportOrdersCsv(HttpServletRequest request, HttpServletResponse response) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            response.setStatus(401);
            try { response.getWriter().write("Not authenticated"); } catch (Exception ignored) {}
            return;
        }

        List<Order> orders = orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=vendor_orders.csv");

        try (OutputStream os = response.getOutputStream()) {
            StringBuilder sb = new StringBuilder();
            sb.append("Order Number,Customer,Total,Status,Date,Delivery Location\n");
            for (Order o : orders) {
                sb.append(escapeCsv(o.getOrderNumber())).append(",");
                sb.append(escapeCsv(o.getCustomerName())).append(",");
                sb.append(o.getTotalAmount()).append(",");
                sb.append(escapeCsv(o.getStatus())).append(",");
                sb.append(new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(new java.util.Date(o.getDatePlaced()))).append(",");
                sb.append(escapeCsv(o.getDeliveryLocation())).append("\n");
            }
            os.write(sb.toString().getBytes(StandardCharsets.UTF_8));
            os.flush();
        } catch (Exception e) {
            response.setStatus(500);
        }
    }

    @GetMapping("/orders/excel")
    public void exportOrdersExcel(HttpServletRequest request, HttpServletResponse response) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            response.setStatus(401);
            try { response.getWriter().write("Not authenticated"); } catch (Exception ignored) {}
            return;
        }

        List<Order> orders = orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=vendor_orders.csv");

        try (OutputStream os = response.getOutputStream()) {
            StringBuilder sb = new StringBuilder();
            sb.append("Order Number,Customer,Total,Status,Date,Delivery Location\n");
            for (Order o : orders) {
                sb.append(escapeCsv(o.getOrderNumber())).append(",");
                sb.append(escapeCsv(o.getCustomerName())).append(",");
                sb.append(o.getTotalAmount()).append(",");
                sb.append(escapeCsv(o.getStatus())).append(",");
                sb.append(new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(new java.util.Date(o.getDatePlaced()))).append(",");
                sb.append(escapeCsv(o.getDeliveryLocation())).append("\n");
            }
            os.write(sb.toString().getBytes(StandardCharsets.UTF_8));
            os.flush();
        } catch (Exception e) {
            response.setStatus(500);
        }
    }

    @GetMapping("/products/csv")
    public void exportProductsCsv(HttpServletRequest request, HttpServletResponse response,
            @org.springframework.beans.factory.annotation.Autowired com.sreemarket.backend.repository.ProductRepository productRepository) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            response.setStatus(401);
            try { response.getWriter().write("Not authenticated"); } catch (Exception ignored) {}
            return;
        }

        List<com.sreemarket.backend.model.Product> products = productRepository.findByVendorId(vendorId);

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=vendor_products.csv");

        try (OutputStream os = response.getOutputStream()) {
            StringBuilder sb = new StringBuilder();
            sb.append("Name,SKU,Category,Price,Stock,Status,HSN Code\n");
            for (com.sreemarket.backend.model.Product p : products) {
                sb.append(escapeCsv(p.getName())).append(",");
                sb.append(escapeCsv(p.getSku())).append(",");
                sb.append(escapeCsv(p.getCategory())).append(",");
                sb.append(p.getDiscountPrice() != null ? p.getDiscountPrice() : (p.getRegularPrice() != null ? p.getRegularPrice() : 0)).append(",");
                sb.append(p.getInitialStock()).append(",");
                sb.append(escapeCsv(p.getStatus())).append(",");
                sb.append(escapeCsv(p.getHsnCode())).append("\n");
            }
            os.write(sb.toString().getBytes(StandardCharsets.UTF_8));
            os.flush();
        } catch (Exception e) {
            response.setStatus(500);
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
