package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.StockMovement;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.repository.StockMovementRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class BulkStockService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;

    public BulkStockService(ProductRepository productRepository, StockMovementRepository stockMovementRepository) {
        this.productRepository = productRepository;
        this.stockMovementRepository = stockMovementRepository;
    }

    public static class ImportResult {
        public int successCount;
        public int failCount;
        public List<String> errors = new ArrayList<>();
    }

    public byte[] exportStockCsv(Long vendorId) {
        List<Product> products;
        if (vendorId != null) {
            products = productRepository.findByVendorId(vendorId);
        } else {
            products = productRepository.findAll();
        }

        StringBuilder csv = new StringBuilder();
        csv.append("SKU,Product Name,Current Stock,Status\n");
        for (Product p : products) {
            csv.append(p.getSku()).append(",")
               .append(escapeCsv(p.getName())).append(",")
               .append(p.getInitialStock()).append(",")
               .append(p.getStatus()).append("\n");
        }
        return csv.toString().getBytes();
    }

    public byte[] exportStockExcel(Long vendorId) {
        List<Product> products;
        if (vendorId != null) {
            products = productRepository.findByVendorId(vendorId);
        } else {
            products = productRepository.findAll();
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Stock Export");
            Row header = sheet.createRow(0);
            String[] cols = {"SKU", "Product Name", "Current Stock", "Status"};
            for (int i = 0; i < cols.length; i++) {
                header.createCell(i).setCellValue(cols[i]);
            }
            int rowNum = 1;
            for (Product p : products) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getSku());
                row.createCell(1).setCellValue(p.getName());
                row.createCell(2).setCellValue(p.getInitialStock());
                row.createCell(3).setCellValue(p.getStatus());
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            return new byte[0];
        }
    }

    public ImportResult importStock(MultipartFile file, Long vendorId) {
        ImportResult result = new ImportResult();
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                try {
                    String sku = getCellStringValue(row.getCell(0));
                    int newStock = (int) getCellNumericValue(row.getCell(2));

                    Product product = productRepository.findBySku(sku);
                    if (product == null) {
                        result.failCount++;
                        result.errors.add("Row " + (i + 1) + ": Product with SKU " + sku + " not found");
                        continue;
                    }
                    if (vendorId != null && !vendorId.equals(product.getVendorId())) {
                        result.failCount++;
                        result.errors.add("Row " + (i + 1) + ": Product " + sku + " does not belong to this vendor");
                        continue;
                    }

                    int oldStock = product.getInitialStock();
                    product.setInitialStock(newStock);
                    productRepository.save(product);

                    StockMovement movement = new StockMovement();
                    movement.setProductId(product.getId());
                    movement.setProductName(product.getName());
                    movement.setProductSku(product.getSku());
                    movement.setProductCategory(product.getCategory());
                    movement.setVendorId(product.getVendorId());
                    movement.setType("IMPORT");
                    movement.setQuantity(newStock - oldStock);
                    movement.setPreviousStock(oldStock);
                    movement.setNewStock(newStock);
                    movement.setReference("Bulk Import");
                    movement.setCreatedAt(System.currentTimeMillis());
                    stockMovementRepository.save(movement);

                    result.successCount++;
                } catch (Exception e) {
                    result.failCount++;
                    result.errors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            result.errors.add("File error: " + e.getMessage());
        }
        return result;
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> "";
        };
    }

    private double getCellNumericValue(Cell cell) {
        if (cell == null) return 0;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING -> Double.parseDouble(cell.getStringCellValue());
            default -> 0;
        };
    }
}
