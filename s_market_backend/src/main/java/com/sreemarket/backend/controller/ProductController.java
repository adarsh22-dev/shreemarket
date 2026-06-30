package com.sreemarket.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.ProductMedia;
import com.sreemarket.backend.service.FileStorageService;
import com.sreemarket.backend.service.ProductService;
import com.sreemarket.backend.service.VendorService;
import com.sreemarket.backend.util.AuthUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

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

    @Autowired
    private VendorService vendorService;

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<?> createProduct(
            @RequestParam("product") String productJson,
            @RequestParam(value = "mediaFiles", required = false) List<MultipartFile> mediaFiles,
            @RequestParam(value = "manufacturerFiles", required = false) List<MultipartFile> manufacturerFiles,
            @RequestParam(value = "videoUrls", required = false) String videoUrlsStr,
            @RequestParam(value = "policyFiles", required = false) List<MultipartFile> policyFiles,
            @RequestParam(value = "instagramUrls", required = false) String instagramUrlsStr,
            @RequestParam(value = "instagramThumbnailFiles", required = false) List<MultipartFile> instagramThumbnailFiles,
            @RequestParam(value = "instagramThumbnailIndices", required = false) String instagramThumbnailIndicesStr,
            @RequestParam(value = "vendorId") Long vendorId,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            if (productJson == null || productJson.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Validation Error", "message", "Product data is required."));
            }

            Product product = objectMapper.readValue(productJson, Product.class);

            // Check if vendor exists and is approved by admin
            try {
                vendorService.ensureVendorIsApproved(vendorId);
            } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "error", "Vendor Not Approved", 
                                "message", e.getMessage()));
            }

            if (product.getName() == null || product.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Validation Error", "message", "Product name is required."));
            }

            // Extract variation media files from multipart request
            java.util.Map<Integer, List<MultipartFile>> variationMediaMap = new java.util.HashMap<>();
            if (request instanceof org.springframework.web.multipart.MultipartHttpServletRequest multipartRequest) {
                for (String paramName : multipartRequest.getMultiFileMap().keySet()) {
                    if (paramName.startsWith("variationMedia_")) {
                        try {
                            int varIndex = Integer.parseInt(paramName.replace("variationMedia_", ""));
                            variationMediaMap.put(varIndex, multipartRequest.getFiles(paramName));
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }

            // Parse video URLs
            java.util.List<String> videoUrls = new java.util.ArrayList<>();
            if (videoUrlsStr != null && !videoUrlsStr.isEmpty()) {
                try {
                    java.util.List<String> parsed = objectMapper.readValue(videoUrlsStr,
                            new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {});
                    if (parsed != null) videoUrls = parsed;
                } catch (Exception ignored) {}
            }

            // Parse Instagram URLs
            java.util.List<String> instagramUrls = new java.util.ArrayList<>();
            if (instagramUrlsStr != null && !instagramUrlsStr.isEmpty()) {
                try {
                    java.util.List<String> parsed = objectMapper.readValue(instagramUrlsStr,
                            new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {});
                    if (parsed != null) instagramUrls = parsed;
                } catch (Exception ignored) {}
            }

            // Parse Instagram thumbnail indices
            java.util.List<Integer> instagramThumbnailIndices = new java.util.ArrayList<>();
            if (instagramThumbnailIndicesStr != null && !instagramThumbnailIndicesStr.isEmpty()) {
                try {
                    instagramThumbnailIndices = objectMapper.readValue(instagramThumbnailIndicesStr,
                            new com.fasterxml.jackson.core.type.TypeReference<java.util.List<Integer>>() {});
                } catch (Exception ignored) {}
            }

            Product savedProduct = productService.saveProduct(product, vendorId, mediaFiles, manufacturerFiles, videoUrls, policyFiles, instagramUrls, instagramThumbnailFiles, instagramThumbnailIndices, variationMediaMap);
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
    public ResponseEntity<?> getAllProducts(
            @RequestParam(required = false) String category) {
        try {
            List<Product> products;
            if (category != null && !category.isEmpty()) {
                products = productService.getProductsByCategory(category);
            } else {
                products = productService.getAllProducts();
            }
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to retrieve products: "
                            + (e.getMessage() != null ? e.getMessage() : "An unexpected error occurred.")));
        }
    }

    @GetMapping("/wholesale")
    public ResponseEntity<?> getWholesaleProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String search) {
        try {
            List<Product> products = productService.getWholesaleProducts(category, minPrice, maxPrice, search);
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to retrieve wholesale products."));
        }
    }

    @GetMapping("/top-deals")
    public ResponseEntity<?> getTopDeals() {
        try {
            List<Product> products = productService.getTopDeals();
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to retrieve top deals: "
                            + (e.getMessage() != null ? e.getMessage() : "An unexpected error occurred.")));
        }
    }

    @GetMapping("/trending")
    public ResponseEntity<?> getTrendingProducts() {
        try {
            List<Product> products = productService.getTrendingProducts();
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to retrieve trending products: "
                            + (e.getMessage() != null ? e.getMessage() : "An unexpected error occurred.")));
        }
    }

    @GetMapping("/featured")
    public ResponseEntity<?> getFeaturedProducts() {
        try {
            List<Product> products = productService.getFeaturedProducts();
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to retrieve featured products: "
                            + (e.getMessage() != null ? e.getMessage() : "An unexpected error occurred.")));
        }
    }

    @GetMapping("/new-arrivals")
    public ResponseEntity<?> getNewArrivals() {
        try {
            List<Product> products = productService.getNewArrivals();
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to retrieve new arrivals: "
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
    public ResponseEntity<?> getProductById(@PathVariable Long id, HttpServletRequest request) {
        try {
            Product product = productService.getProductById(id);
            Long currentUserId = AuthUtil.getAuthenticatedUserId(request);
            boolean isVendorOrAdmin = currentUserId != null && (
                product.getVendorId() != null && product.getVendorId().equals(currentUserId)
                || AuthUtil.isAdmin());
            if (!"Approved".equals(product.getApprovalStatus()) && !isVendorOrAdmin) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not Found", "message", "Product not found with id: " + id));
            }
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

    @PutMapping("/bulk-edit")
    public ResponseEntity<?> bulkEditProducts(@RequestBody Map<String, Object> requestBody) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> ids = ((List<Number>) requestBody.get("ids")).stream()
                    .map(Number::longValue).collect(java.util.stream.Collectors.toList());
            @SuppressWarnings("unchecked")
            Map<String, Object> fields = (Map<String, Object>) requestBody.get("fields");

            if (ids == null || ids.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Validation Error", "message", "Product IDs are required."));
            }
            if (fields == null || fields.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Validation Error", "message", "At least one field to update is required."));
            }

            productService.bulkEditProducts(ids, fields);
            return ResponseEntity.ok(Map.of("message", ids.size() + " products updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to bulk edit products: " + e.getMessage()));
        }
    }

    @PostMapping("/bulk-upload")
    public ResponseEntity<?> uploadProductsBulk(
            @RequestParam("file") MultipartFile file,
            @RequestParam("vendorId") Long vendorId) {
        try {
            // Check if vendor exists and is approved by admin
            try {
                vendorService.ensureVendorIsApproved(vendorId);
            } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "error", "Vendor Not Approved", 
                                "message", e.getMessage()));
            }

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

    @PostMapping("/{id}/manufacturer-media")
    public ResponseEntity<?> uploadManufacturerMedia(
            @PathVariable Long id,
            @RequestParam("manufacturerMedia") List<MultipartFile> manufacturerMedia) {
        try {
            Product product = productService.getProductById(id);

            for (MultipartFile file : manufacturerMedia) {
                if (!file.isEmpty()) {
                    String fileUrl = fileStorageService.storeFile(file, "products", true);
                    String fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

                    ProductMedia media = new ProductMedia();
                    media.setProduct(product);
                    media.setFileName(fileName);
                    media.setFileType(file.getContentType() != null && file.getContentType().startsWith("video/") ? "video" : "image");
                    media.setMediaType("manufacturer");
                    media.setIsPrimary(false);
                    product.getMedia().add(media);
                }
            }
            Product updated = productService.saveProductOnly(product);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload manufacturer media: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/{id}", consumes = { "multipart/form-data" })
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestParam("product") String productJson,
            @RequestParam(value = "mediaFiles", required = false) List<MultipartFile> mediaFiles,
            @RequestParam(value = "manufacturerFiles", required = false) List<MultipartFile> manufacturerFiles,
            @RequestParam(value = "videoUrls", required = false) String videoUrlsStr,
            @RequestParam(value = "policyFiles", required = false) List<MultipartFile> policyFiles,
            @RequestParam(value = "manufacturerMediaIds", required = false) String manufacturerMediaIdsStr,
            @RequestParam(value = "instagramUrls", required = false) String instagramUrlsStr,
            @RequestParam(value = "instagramThumbnailFiles", required = false) List<MultipartFile> instagramThumbnailFiles,
            @RequestParam(value = "instagramThumbnailIndices", required = false) String instagramThumbnailIndicesStr,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            if (productJson == null || productJson.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Validation Error", "message", "Product data is required."));
            }

            Product productData = objectMapper.readValue(productJson, Product.class);

            // Extract variation media files
            java.util.Map<Integer, List<MultipartFile>> variationMediaMap = new java.util.HashMap<>();
            if (request instanceof org.springframework.web.multipart.MultipartHttpServletRequest multipartRequest) {
                for (String paramName : multipartRequest.getMultiFileMap().keySet()) {
                    if (paramName.startsWith("variationMedia_")) {
                        try {
                            int varIndex = Integer.parseInt(paramName.replace("variationMedia_", ""));
                            variationMediaMap.put(varIndex, multipartRequest.getFiles(paramName));
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }

            // Parse manufacturer media IDs to preserve existing manufacturer images
            java.util.List<Long> manufacturerMediaIds = new java.util.ArrayList<>();
            if (manufacturerMediaIdsStr != null && !manufacturerMediaIdsStr.isEmpty()) {
                try {
                    java.util.List<Long> parsed = objectMapper.readValue(manufacturerMediaIdsStr,
                            new com.fasterxml.jackson.core.type.TypeReference<java.util.List<Long>>() {});
                    if (parsed != null) manufacturerMediaIds = parsed;
                } catch (Exception ignored) {}
            }

            // Parse video URLs
            java.util.List<String> videoUrls = new java.util.ArrayList<>();
            if (videoUrlsStr != null && !videoUrlsStr.isEmpty()) {
                try {
                    java.util.List<String> parsed = objectMapper.readValue(videoUrlsStr,
                            new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {});
                    if (parsed != null) videoUrls = parsed;
                } catch (Exception ignored) {}
            }

            // Parse Instagram URLs
            java.util.List<String> instagramUrls = new java.util.ArrayList<>();
            if (instagramUrlsStr != null && !instagramUrlsStr.isEmpty()) {
                try {
                    java.util.List<String> parsed = objectMapper.readValue(instagramUrlsStr,
                            new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {});
                    if (parsed != null) instagramUrls = parsed;
                } catch (Exception ignored) {}
            }

            // Parse Instagram thumbnail indices
            java.util.List<Integer> instagramThumbnailIndices = new java.util.ArrayList<>();
            if (instagramThumbnailIndicesStr != null && !instagramThumbnailIndicesStr.isEmpty()) {
                try {
                    instagramThumbnailIndices = objectMapper.readValue(instagramThumbnailIndicesStr,
                            new com.fasterxml.jackson.core.type.TypeReference<java.util.List<Integer>>() {});
                } catch (Exception ignored) {}
            }

            Product updatedProduct = productService.updateProduct(id, productData, mediaFiles, manufacturerFiles, videoUrls, manufacturerMediaIds, policyFiles, instagramUrls, instagramThumbnailFiles, instagramThumbnailIndices, variationMediaMap);

            return new ResponseEntity<>(updatedProduct, HttpStatus.OK);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid JSON", "message", "The product data is not valid JSON."));
        } catch (VendorService.VendorNotApprovedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Vendor Not Approved", "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not Found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Server Error", "message", "Failed to update product."));
        }
    }

    @DeleteMapping("/{productId}/media/{mediaId}")
    public ResponseEntity<?> deleteProductMedia(@PathVariable Long productId, @PathVariable Long mediaId) {
        try {
            productService.deleteProductMedia(mediaId);
            return ResponseEntity.ok(Map.of("message", "Media deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{productId}/instagram")
    public ResponseEntity<?> addInstagramUrl(@PathVariable Long productId, @RequestBody Map<String, String> body) {
        try {
            String url = body.get("url");
            if (url == null || url.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "URL is required"));
            }
            ProductMedia media = productService.addInstagramUrl(productId, url.trim());
            return ResponseEntity.ok(media);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/media/{mediaId}")
    public ResponseEntity<?> updateProductMedia(@PathVariable Long mediaId, @RequestBody Map<String, String> body) {
        try {
            String url = body.get("url");
            if (url == null || url.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "URL is required"));
            }
            ProductMedia media = productService.updateProductMedia(mediaId, url.trim());
            return ResponseEntity.ok(media);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

}
