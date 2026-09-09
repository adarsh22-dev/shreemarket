package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/vendor/reports")
public class VendorReportsController {

    private static final Logger log = LoggerFactory.getLogger(VendorReportsController.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/orders/csv")
    public void exportOrdersCsv(HttpServletRequest request, HttpServletResponse response) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            response.setStatus(401);
            try { response.getWriter().write("Not authenticated"); } catch (Exception e) { /* non-critical */ }
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
            try { response.getWriter().write("Not authenticated"); } catch (Exception e) { /* non-critical */ }
            return;
        }

        List<Order> orders = orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=vendor_orders.xlsx");

        try (OutputStream os = response.getOutputStream()) {
            org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
            org.apache.poi.xssf.usermodel.XSSFSheet sheet = workbook.createSheet("Orders");
            org.apache.poi.xssf.usermodel.XSSFRow header = sheet.createRow(0);
            String[] headers = {"Order Number", "Customer", "Total", "Status", "Date", "Delivery Location"};
            for (int i = 0; i < headers.length; i++) header.createCell(i).setCellValue(headers[i]);
            int rowNum = 1;
            for (Order o : orders) {
                org.apache.poi.xssf.usermodel.XSSFRow row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(o.getOrderNumber() != null ? o.getOrderNumber() : "");
                row.createCell(1).setCellValue(o.getCustomerName() != null ? o.getCustomerName() : "");
                row.createCell(2).setCellValue(o.getTotalAmount() != null ? o.getTotalAmount() : 0);
                row.createCell(3).setCellValue(o.getStatus() != null ? o.getStatus() : "");
                row.createCell(4).setCellValue(o.getDatePlaced() != null ? new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(new java.util.Date(o.getDatePlaced())) : "");
                row.createCell(5).setCellValue(o.getDeliveryLocation() != null ? o.getDeliveryLocation() : "");
            }
            workbook.write(os);
            workbook.close();
            os.flush();
        } catch (Exception e) {
            response.setStatus(500);
        }
    }

    @GetMapping("/products/csv")
    public void exportProductsCsv(HttpServletRequest request, HttpServletResponse response) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            response.setStatus(401);
            try { response.getWriter().write("Not authenticated"); } catch (Exception e) { /* non-critical */ }
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
