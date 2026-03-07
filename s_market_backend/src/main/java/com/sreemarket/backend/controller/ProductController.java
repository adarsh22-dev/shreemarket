package com.sreemarket.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<?> createProduct(
            @RequestParam("product") String productJson,
            @RequestParam(value = "mediaFiles", required = false) List<MultipartFile> mediaFiles,
            @RequestParam(value = "policyFiles", required = false) List<MultipartFile> policyFiles,
            @RequestParam(value = "vendorId", required = false) Long vendorId) {
        try {
            if (productJson == null || productJson.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Validation Error", "message", "Product data is required."));
            }

            Product product = objectMapper.readValue(productJson, Product.class);

            if (product.getName() == null || product.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Validation Error", "message", "Product name is required."));
            }

            Product savedProduct = productService.saveProduct(product, vendorId, mediaFiles, policyFiles);
            return new ResponseEntity<>(savedProduct, HttpStatus.CREATED);

        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid JSON", "message",
                            "The product data is not valid JSON. Please check the format."));
        } catch (java.io.IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "File Upload Error", "message",
                            "Failed to save uploaded files: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to create product: "
                            + (e.getMessage() != null ? e.getMessage() : "An unexpected error occurred.")));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllProducts() {
        try {
            List<Product> products = productService.getAllProducts();
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to retrieve products: "
                            + (e.getMessage() != null ? e.getMessage() : "An unexpected error occurred.")));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchProducts(@RequestParam("q") String query) {
        try {
            List<Product> products = productService.searchProducts(query);
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to search products: "
                            + (e.getMessage() != null ? e.getMessage() : "An unexpected error occurred.")));
        }
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<?> getVendorProducts(
            @PathVariable Long vendorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status) {
        try {
            if (page < 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Validation Error", "message", "Page number must be 0 or greater."));
            }
            if (size < 1 || size > 100) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Validation Error", "message", "Page size must be between 1 and 100."));
            }
            if (sort.length < 2) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Validation Error", "message",
                                "Sort parameter must be in format 'field,direction' (e.g., 'id,desc')."));
            }

            Sort sortObj = Sort.by(
                    sort[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
                    sort[0]);

            Pageable pageable = PageRequest.of(page, size, sortObj);

            Page<Product> products = productService.getPaginatedAndFilteredProducts(vendorId, search, category, status,
                    pageable);
            return new ResponseEntity<>(products, HttpStatus.OK);

        } catch (org.springframework.data.mapping.PropertyReferenceException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid Sort Field", "message", "The sort field '" + sort[0]
                            + "' does not exist. Valid fields include: id, name, category, sku, status, regularPrice."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to retrieve vendor products: "
                            + (e.getMessage() != null ? e.getMessage() : "An unexpected error occurred.")));
        }
    }

    @GetMapping("/single/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        try {
            Product product = productService.getProductById(id);
            return new ResponseEntity<>(product, HttpStatus.OK);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not Found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "An unexpected error occurred."));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not Found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to delete product."));
        }
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<?> deleteProductsBulk(@RequestBody List<Long> ids) {
        try {
            productService.deleteProductsBulk(ids);
            return ResponseEntity.ok(Map.of("message", "Selected products deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to delete products in bulk."));
        }
    }

    @PutMapping("/bulk/stock")
    public ResponseEntity<?> updateProductsStockBulk(
            @RequestBody List<Long> ids,
            @RequestParam("stock") Integer stock) {
        try {
            productService.updateProductsStockBulk(ids, stock);
            return ResponseEntity.ok(Map.of("message", "Selected products stock updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to update products stock in bulk."));
        }
    }

    @PostMapping("/bulk-upload")
    public ResponseEntity<?> uploadProductsBulk(
            @RequestParam("file") MultipartFile file,
            @RequestParam("vendorId") Long vendorId) {
        try {
            List<Product> uploadedProducts = productService.uploadProductsBulk(file, vendorId);
            return ResponseEntity.ok(Map.of(
                    "message", "Successfully uploaded " + uploadedProducts.size() + " products",
                    "count", uploadedProducts.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload Error", "message",
                            "Failed to process bulk upload: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/{id}", consumes = { "multipart/form-data" })
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestParam("product") String productJson,
            @RequestParam(value = "mediaFiles", required = false) List<MultipartFile> mediaFiles,
            @RequestParam(value = "policyFiles", required = false) List<MultipartFile> policyFiles) {
        try {
            if (productJson == null || productJson.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Validation Error", "message", "Product data is required."));
            }

            Product productData = objectMapper.readValue(productJson, Product.class);
            Product updatedProduct = productService.updateProduct(id, productData, mediaFiles, policyFiles);

            return new ResponseEntity<>(updatedProduct, HttpStatus.OK);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid JSON", "message", "The product data is not valid JSON."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not Found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to update product."));
        }
    }
}
