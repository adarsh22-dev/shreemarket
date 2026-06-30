package com.sreemarket.backend.service;

import com.sreemarket.backend.model.*;
import com.sreemarket.backend.model.Notification;
import com.sreemarket.backend.repository.BulkPricingTierRepository;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.repository.ProductMediaRepository;
import com.sreemarket.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Value;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private VendorActivityService vendorActivityService;

    @Autowired
    private StockMovementService stockMovementService;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private String getProductUploadDir() {
        return Paths.get(uploadDir, "products").toAbsolutePath().normalize().toString();
    }

    @Autowired
    private BulkPricingTierRepository bulkPricingTierRepository;

    @Transactional
    public Product saveProduct(Product product, Long vendorId, List<MultipartFile> mediaFiles,
            List<MultipartFile> manufacturerFiles, List<String> videoUrls, List<MultipartFile> policyFiles) throws IOException {
        return saveProduct(product, vendorId, mediaFiles, manufacturerFiles, videoUrls, policyFiles, null, null, null, null);
    }

    @Transactional
    public Product saveProduct(Product product, Long vendorId, List<MultipartFile> mediaFiles,
            List<MultipartFile> manufacturerFiles, List<String> videoUrls, List<MultipartFile> policyFiles,
            List<String> instagramUrls) throws IOException {
        return saveProduct(product, vendorId, mediaFiles, manufacturerFiles, videoUrls, policyFiles, instagramUrls, null, null, null);
    }

    @Transactional
    public Product saveProduct(Product product, Long vendorId, List<MultipartFile> mediaFiles,
            List<MultipartFile> manufacturerFiles, List<String> videoUrls, List<MultipartFile> policyFiles,
            List<String> instagramUrls,
            java.util.Map<Integer, List<MultipartFile>> variationMediaMap) throws IOException {
        return saveProduct(product, vendorId, mediaFiles, manufacturerFiles, videoUrls, policyFiles, instagramUrls, null, null, variationMediaMap);
    }

    @Transactional
    public Product saveProduct(Product product, Long vendorId, List<MultipartFile> mediaFiles,
            List<MultipartFile> manufacturerFiles, List<String> videoUrls, List<MultipartFile> policyFiles,
            List<String> instagramUrls,
            List<MultipartFile> instagramThumbnailFiles,
            java.util.List<Integer> instagramThumbnailIndices,
            java.util.Map<Integer, List<MultipartFile>> variationMediaMap) throws IOException {

        // Validate vendor approval before allowing product creation
        // vendorId is now required - new vendors cannot add products until approved
        vendorService.ensureVendorIsApproved(vendorId);
        product.setVendorId(vendorId);

        // Set approval status to Pending for admin review
        product.setApprovalStatus("Pending");

        // Ensure both ends of the relationship are correctly set for cascading
        // structures
        if (product.getAttributes() != null) {
            product.getAttributes().forEach(a -> a.setProduct(product));
        }
        if (product.getVariations() != null) {
            product.getVariations().forEach(v -> v.setProduct(product));
        }
        if (product.getTags() != null) {
            product.getTags().forEach(t -> t.setProduct(product));
        }
        if (product.getLinkedProducts() != null) {
            product.getLinkedProducts().forEach(l -> l.setProduct(product));
        }
        if (product.getPricingTiers() != null) {
            product.getPricingTiers().forEach(t -> t.setProduct(product));
        }

        // Save the base entity first
        Product savedProduct = productRepository.save(product);

        // Process file uploads
        File uploadDirectory = new File(getProductUploadDir());
        if (!uploadDirectory.exists()) {
            uploadDirectory.mkdirs();
        }

        // Process Media - Only if new files are provided
        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            // After save, find already-persisted metadata entries that still need
            // file assignment (fileName is null because they were cascade-persisted
            // by the save above before file processing)
            List<ProductMedia> newMediaMetadata = new ArrayList<>();
            if (savedProduct.getMedia() != null) {
                for (ProductMedia m : savedProduct.getMedia()) {
                    if (m.getFileName() == null) {
                        newMediaMetadata.add(m);
                    }
                }
            }

            for (int i = 0; i < mediaFiles.size(); i++) {
                MultipartFile file = mediaFiles.get(i);
                if (!file.isEmpty()) {
                    String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                    Path filePath = Paths.get(getProductUploadDir(), fileName);
                    Files.copy(file.getInputStream(), filePath);

                    ProductMedia media;
                    if (i < newMediaMetadata.size()) {
                        // Use the already-persisted metadata entry and update its fileName
                        media = newMediaMetadata.get(i);
                    } else {
                        // Fallback if more files than metadata entries
                        media = new ProductMedia();
                        boolean hasPrimary = savedProduct.getMedia().stream()
                                .anyMatch(m -> Boolean.TRUE.equals(m.getIsPrimary()));
                        media.setIsPrimary(!hasPrimary);
                        media.setMediaType("gallery");
                        media.setProduct(savedProduct);
                        savedProduct.getMedia().add(media);
                    }

                    media.setFileName(fileName);
                    media.setFileType(
                            file.getContentType() != null && file.getContentType().startsWith("video/") ? "video"
                                    : "image");
                }
            }
        }

        // Process Policy Documents
        if (policyFiles != null && !policyFiles.isEmpty()) {
            // Because policy files might have titles sent from frontend, we will pair the
            // files with existing PolicyDocument objects that came via JSON, OR create new
            // ones here.
            // For simplicity, let's assume the frontend sends the title list in the exact
            // same order as the multipart files.
            // If the product.getPolicyDocuments() list matches the size of policyFiles:
            List<PolicyDocument> existingDocsInfo = product.getPolicyDocuments();

            for (int i = 0; i < policyFiles.size(); i++) {
                MultipartFile file = policyFiles.get(i);
                if (!file.isEmpty()) {
                    String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                    Path filePath = Paths.get(getProductUploadDir(), fileName);
                    Files.copy(file.getInputStream(), filePath);

                    PolicyDocument doc;
                    if (existingDocsInfo != null && i < existingDocsInfo.size()) {
                        doc = existingDocsInfo.get(i);
                    } else {
                        doc = new PolicyDocument();
                        doc.setTitle(file.getOriginalFilename());
                        savedProduct.getPolicyDocuments().add(doc);
                    }
                    doc.setProduct(savedProduct);
                    doc.setFileName(fileName);
                }
            }
        }

        // Process Variation Media - save the first (primary) image for each variation
        if (variationMediaMap != null && savedProduct.getVariations() != null) {
            for (java.util.Map.Entry<Integer, List<MultipartFile>> entry : variationMediaMap.entrySet()) {
                int varIndex = entry.getKey();
                List<MultipartFile> varFiles = entry.getValue();
                if (varIndex < savedProduct.getVariations().size() && varFiles != null && !varFiles.isEmpty()) {
                    MultipartFile primaryFile = varFiles.get(0);
                    if (!primaryFile.isEmpty()) {
                        String fileName = UUID.randomUUID().toString() + "_" + primaryFile.getOriginalFilename();
                        Path filePath = Paths.get(getProductUploadDir(), fileName);
                        Files.copy(primaryFile.getInputStream(), filePath);
                        savedProduct.getVariations().get(varIndex).setImageFileName(fileName);
                    }
                }
            }
        }

        // Process Manufacturer Media - save with mediaType "manufacturer"
        if (manufacturerFiles != null && !manufacturerFiles.isEmpty()) {
            for (MultipartFile file : manufacturerFiles) {
                if (!file.isEmpty()) {
                    String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                    Path filePath = Paths.get(getProductUploadDir(), fileName);
                    Files.copy(file.getInputStream(), filePath);

                    ProductMedia media = new ProductMedia();
                    media.setProduct(savedProduct);
                    media.setFileName(fileName);
                    media.setFileType("image");
                    media.setMediaType("manufacturer");
                    media.setIsPrimary(false);
                    savedProduct.getMedia().add(media);
                }
            }
        }

        // Process Video URLs
        if (videoUrls != null && !videoUrls.isEmpty()) {
            for (String url : videoUrls) {
                if (url != null && !url.trim().isEmpty()) {
                    ProductMedia media = new ProductMedia();
                    media.setProduct(savedProduct);
                    media.setFileName(url.trim());
                    media.setFileType("video-url");
                    media.setMediaType("video-gallery");
                    media.setIsPrimary(false);
                    savedProduct.getMedia().add(media);
                }
            }
        }

        // Process Instagram URLs
        if (instagramUrls != null && !instagramUrls.isEmpty()) {
            for (String url : instagramUrls) {
                if (url != null && !url.trim().isEmpty()) {
                    ProductMedia media = new ProductMedia();
                    media.setProduct(savedProduct);
                    media.setFileName(url.trim());
                    media.setFileType("instagram-url");
                    media.setMediaType("instagram");
                    media.setIsPrimary(false);
                    savedProduct.getMedia().add(media);
                }
            }
        }

        // Save before processing Instagram thumbnails so media IDs are assigned
        savedProduct = productRepository.save(savedProduct);

        // Process Instagram thumbnail files
        if (instagramThumbnailFiles != null && !instagramThumbnailFiles.isEmpty()
                && instagramThumbnailIndices != null && !instagramThumbnailIndices.isEmpty()) {
            List<ProductMedia> instagramMediaList = savedProduct.getMedia().stream()
                    .filter(m -> "instagram".equals(m.getMediaType()) && "instagram-url".equals(m.getFileType()))
                    .collect(java.util.stream.Collectors.toList());

            for (int i = 0; i < instagramThumbnailIndices.size() && i < instagramThumbnailFiles.size(); i++) {
                int urlIndex = instagramThumbnailIndices.get(i);
                MultipartFile thumbFile = instagramThumbnailFiles.get(i);
                if (thumbFile != null && !thumbFile.isEmpty() && urlIndex < instagramMediaList.size()) {
                    String thumbFileName = UUID.randomUUID().toString() + "_" + thumbFile.getOriginalFilename();
                    Path thumbPath = Paths.get(getProductUploadDir(), thumbFileName);
                    Files.copy(thumbFile.getInputStream(), thumbPath);
                    instagramMediaList.get(urlIndex).setCustomThumbnail(thumbFileName);
                }
            }
        }

        Product finalProduct = productRepository.save(savedProduct);

        // Log vendor activity
        try {
            Vendor vendor = vendorService.getVendorById(vendorId);
            vendorActivityService.logActivity(vendorId, vendor.getFullName(),
                    "product_created",
                    "Created product: " + finalProduct.getName(),
                    null);
        } catch (Exception ignored) {}

        return finalProduct;
    }

    public List<Product> getAllProducts() {
        return productRepository.findByApprovalStatus("Approved").stream()
            .filter(p -> {
                boolean hasImage = p.getMedia() != null && !p.getMedia().isEmpty()
                    && p.getMedia().stream().anyMatch(m -> m.getFileName() != null && !m.getFileName().isEmpty());
                boolean hasPrice = (p.getRegularPrice() != null && p.getRegularPrice() >= 1)
                    || (p.getDiscountPrice() != null && p.getDiscountPrice() >= 1);
                boolean inStock = !"out".equalsIgnoreCase(p.getStatus())
                    && (p.getInitialStock() == null || p.getInitialStock() > 0);
                return hasImage && hasPrice && inStock;
            })
            .collect(java.util.stream.Collectors.toList());
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategoryAndApprovalStatus(category, "Approved").stream()
            .filter(p -> {
                boolean hasImage = p.getMedia() != null && !p.getMedia().isEmpty()
                    && p.getMedia().stream().anyMatch(m -> m.getFileName() != null && !m.getFileName().isEmpty());
                boolean hasPrice = (p.getRegularPrice() != null && p.getRegularPrice() >= 1)
                    || (p.getDiscountPrice() != null && p.getDiscountPrice() >= 1);
                boolean inStock = !"out".equalsIgnoreCase(p.getStatus())
                    && (p.getInitialStock() == null || p.getInitialStock() > 0);
                return hasImage && hasPrice && inStock;
            })
            .collect(java.util.stream.Collectors.toList());
    }

    public List<Product> searchProducts(String query) {
        return productRepository.findByNameContainingIgnoreCaseOrSkuContainingIgnoreCaseAndApprovalStatus(query, query, "Approved").stream()
            .filter(p -> {
                boolean hasImage = p.getMedia() != null && !p.getMedia().isEmpty()
                    && p.getMedia().stream().anyMatch(m -> m.getFileName() != null && !m.getFileName().isEmpty());
                boolean hasPrice = (p.getRegularPrice() != null && p.getRegularPrice() >= 1)
                    || (p.getDiscountPrice() != null && p.getDiscountPrice() >= 1);
                boolean inStock = !"out".equalsIgnoreCase(p.getStatus())
                    && (p.getInitialStock() == null || p.getInitialStock() > 0);
                return hasImage && hasPrice && inStock;
            })
            .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public Product updateApprovalStatus(Long id, String approvalStatus) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        product.setApprovalStatus(approvalStatus);
        return productRepository.save(product);
    }

    public List<Product> getProductsByVendor(Long vendorId) {
        return productRepository.findByVendorId(vendorId);
    }

    @Transactional(readOnly = true)
    public Page<Product> getPaginatedAndFilteredProducts(Long vendorId, String search, String category, String status,
            Pageable pageable) {
        Specification<Product> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filter by vendor
            predicates.add(criteriaBuilder.equal(root.get("vendorId"), vendorId));

            // Search by name or sku
            if (search != null && !search.trim().isEmpty()) {
                String likePattern = "%" + search.toLowerCase() + "%";
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), likePattern);
                Predicate skuLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("sku")), likePattern);
                predicates.add(criteriaBuilder.or(nameLike, skuLike));
            }

            // Filter by category
            if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("All Categories")) {
                predicates.add(criteriaBuilder.equal(root.get("category"), category));
            }

            // Filter by status
            if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("All Status")) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return productRepository.findAll(spec, pageable);
    }

    @Transactional
    public Product saveProductOnly(Product product) {
        return productRepository.save(product);
    }

    @Autowired
    private ProductMediaRepository productMediaRepository;

    public void deleteProduct(Long id) {
        if (productRepository.existsById(id)) {
            // Note: In a production environment, you might also want to delete the physical
            // files from the getProductUploadDir()
            productRepository.deleteById(id);
        } else {
            throw new RuntimeException("Product not found with id: " + id);
        }
    }

    @Transactional
    public void deleteProductMedia(Long mediaId) {
        if (productMediaRepository.existsById(mediaId)) {
            productMediaRepository.deleteById(mediaId);
        } else {
            throw new RuntimeException("Media not found with id: " + mediaId);
        }
    }

    @Transactional
    public ProductMedia uploadCustomThumbnail(Long mediaId, MultipartFile file) throws IOException {
        ProductMedia media = productMediaRepository.findById(mediaId)
                .orElseThrow(() -> new RuntimeException("Media not found with id: " + mediaId));

        File uploadDirectory = new File(getProductUploadDir());
        if (!uploadDirectory.exists()) {
            uploadDirectory.mkdirs();
        }

        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(getProductUploadDir(), fileName);
        Files.copy(file.getInputStream(), filePath);

        media.setCustomThumbnail(fileName);
        return productMediaRepository.save(media);
    }

    @Transactional
    public ProductMedia addInstagramUrl(Long productId, String url) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        ProductMedia media = new ProductMedia();
        media.setProduct(product);
        media.setFileName(url.trim());
        media.setFileType("instagram-url");
        media.setMediaType("instagram");
        media.setIsPrimary(false);
        return productMediaRepository.save(media);
    }

    @Transactional
    public ProductMedia updateProductMedia(Long mediaId, String fileName) {
        ProductMedia media = productMediaRepository.findById(mediaId)
                .orElseThrow(() -> new RuntimeException("Media not found with id: " + mediaId));
        media.setFileName(fileName.trim());
        return productMediaRepository.save(media);
    }

    @Transactional
    public void deleteProductsBulk(List<Long> ids) {
        if (ids != null && !ids.isEmpty()) {
            // In a real environment, we might also delete files associated with these
            // products
            productRepository.deleteAllById(ids);
        }
    }

    @Transactional
    public void updateProductsStockBulk(List<Long> ids, Integer newStock) {
        if (ids != null && !ids.isEmpty() && newStock != null) {
            List<Product> products = productRepository.findAllById(ids);
            for (Product product : products) {
                Integer oldStock = product.getInitialStock();
                int diff = newStock - (oldStock != null ? oldStock : 0);
                product.setInitialStock(newStock);

                // Log stock movement
                if (!newStock.equals(oldStock)) {
                    String movementType = diff > 0 ? "IN" : "OUT";
                    try {
                        stockMovementService.logFromProduct(product, product.getVendorId(),
                            movementType, Math.abs(diff),
                            oldStock, newStock,
                            "Manual bulk update", "Vendor", "Bulk stock update to " + newStock);
                    } catch (Exception ignored) {}

                    if (newStock == 0) {
                        Notification notification = new Notification();
                        notification.setVendorId(product.getVendorId());
                        notification.setTitle("Out of Stock");
                        notification.setMessage("Product " + product.getName() + " is now out of stock.");
                        notification.setType("OUT_OF_STOCK");
                        notificationService.createNotification(notification);
                    } else if (newStock <= 5) {
                        Notification notification = new Notification();
                        notification.setVendorId(product.getVendorId());
                        notification.setTitle("Low Stock Warning");
                        notification.setMessage(
                                "Product " + product.getName() + " has low stock (" + newStock + " remaining).");
                        notification.setType("LOW_STOCK");
                        notificationService.createNotification(notification);
                    }
                }
            }
            productRepository.saveAll(products);
        }
    }

    @Transactional
    public void bulkEditProducts(List<Long> ids, java.util.Map<String, Object> fields) {
        if (ids == null || ids.isEmpty() || fields == null || fields.isEmpty()) {
            return;
        }
        List<Product> products = productRepository.findAllById(ids);
        for (Product product : products) {
            if (fields.containsKey("name")) product.setName((String) fields.get("name"));
            if (fields.containsKey("category")) product.setCategory((String) fields.get("category"));
            if (fields.containsKey("subCategory")) product.setSubCategory((String) fields.get("subCategory"));
            if (fields.containsKey("brand")) product.setBrand((String) fields.get("brand"));
            if (fields.containsKey("status")) product.setStatus((String) fields.get("status"));
            if (fields.containsKey("sku")) product.setSku((String) fields.get("sku"));
            if (fields.containsKey("shortDescription")) product.setShortDescription((String) fields.get("shortDescription"));
            if (fields.containsKey("description")) product.setDescription((String) fields.get("description"));
            if (fields.containsKey("regularPrice")) {
                Object val = fields.get("regularPrice");
                product.setRegularPrice(val instanceof Number ? ((Number) val).doubleValue() : Double.parseDouble(val.toString()));
            }
            if (fields.containsKey("discountPrice")) {
                Object val = fields.get("discountPrice");
                product.setDiscountPrice(val instanceof Number ? ((Number) val).doubleValue() : Double.parseDouble(val.toString()));
            }
            if (fields.containsKey("initialStock")) {
                Object val = fields.get("initialStock");
                Integer newStock = val instanceof Number ? ((Number) val).intValue() : Integer.parseInt(val.toString());
                Integer oldStock = product.getInitialStock();
                product.setInitialStock(newStock);

                if (!newStock.equals(oldStock)) {
                    int diff = newStock - (oldStock != null ? oldStock : 0);
                    String movementType = diff > 0 ? "IN" : "OUT";
                    try {
                        stockMovementService.logFromProduct(product, product.getVendorId(),
                            movementType, Math.abs(diff),
                            oldStock, newStock,
                            "Bulk edit", "Vendor", "Bulk edit stock change");
                    } catch (Exception ignored) {}

                    if (newStock == 0) {
                        Notification notification = new Notification();
                        notification.setVendorId(product.getVendorId());
                        notification.setTitle("Out of Stock");
                        notification.setMessage("Product " + product.getName() + " is now out of stock.");
                        notification.setType("OUT_OF_STOCK");
                        notificationService.createNotification(notification);
                    } else if (newStock <= 5) {
                        Notification notification = new Notification();
                        notification.setVendorId(product.getVendorId());
                        notification.setTitle("Low Stock Warning");
                        notification.setMessage("Product " + product.getName() + " has low stock (" + newStock + " remaining).");
                        notification.setType("LOW_STOCK");
                        notificationService.createNotification(notification);
                    }
                }
            }
        }
        productRepository.saveAll(products);
    }

    @Transactional
    public List<Product> uploadProductsBulk(MultipartFile file, Long vendorId) throws IOException {
        // Validate vendor approval before allowing bulk product upload
        // vendorId is required - new vendors cannot add products until approved
        vendorService.ensureVendorIsApproved(vendorId);
        
        List<Product> products = new ArrayList<>();
        try (java.io.BufferedReader br = new java.io.BufferedReader(
                new java.io.InputStreamReader(file.getInputStream()))) {
            String line;
            br.readLine(); // Skip header

            while ((line = br.readLine()) != null) {
                String[] data = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)"); // Split by comma but ignore commas
                                                                                 // inside quotes
                if (data.length >= 5) {
                    Product product = new Product();
                    product.setName(cleanCsvValue(data[0]));
                    product.setSku(cleanCsvValue(data[1]));
                    product.setCategory(cleanCsvValue(data[2]));
                    product.setRegularPrice(parseOptionalDouble(data[3]));
                    product.setInitialStock(parseOptionalInt(data[4]));
                    product.setStatus("in"); // Default stock status
                    product.setApprovalStatus("Pending"); // Needs admin approval
                    product.setType("single");
                    product.setVendorId(vendorId);

                    if (data.length > 5) {
                        product.setShortDescription(cleanCsvValue(data[5]));
                    }

                    products.add(productRepository.save(product));
                }
            }
        }
        return products;
    }

    private String cleanCsvValue(String value) {
        if (value == null)
            return "";
        value = value.trim();
        if (value.startsWith("\"") && value.endsWith("\"")) {
            value = value.substring(1, value.length() - 1).replace("\"\"", "\"");
        }
        return value;
    }

    private Double parseOptionalDouble(String value) {
        try {
            return Double.parseDouble(cleanCsvValue(value));
        } catch (Exception e) {
            return 0.0;
        }
    }

    private Integer parseOptionalInt(String value) {
        try {
            return Integer.parseInt(cleanCsvValue(value));
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Get new arrivals from the last 3 days, filtered by:
     * - Approved products only
     * - Must have at least one media (image)
     * - Must have a price (regularPrice or discountPrice)
     * - Must be in stock (status != "out" and initialStock > 0)
     * - Sorted by category performance (higher total bookingCount per category first)
     */
    /**
     * Get top deals — products with discounts that were sold in the last 3 days.
     * Aggregates order quantities from the last 72 hours, filters to products
     * with an active discount (discountPrice < regularPrice), sorts by discount
     * percentage descending, then returns the top 3.
     */
    public List<Product> getTopDeals() {
        long threeDaysAgo = System.currentTimeMillis() - (3 * 24 * 60 * 60 * 1000L);
        List<com.sreemarket.backend.model.Order> recentOrders = orderRepository.findByDatePlacedAfterOrderByDatePlacedAsc(threeDaysAgo);

        // Collect IDs of products sold in the last 3 days
        java.util.Set<Long> soldProductIds = new java.util.HashSet<>();
        for (com.sreemarket.backend.model.Order order : recentOrders) {
            if (order.getProductQuantities() != null) {
                soldProductIds.addAll(order.getProductQuantities().keySet());
            }
        }

        if (soldProductIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        // Fetch the sold products
        List<Product> allSoldProducts = productRepository.findAllById(soldProductIds);

        // Filter to valid, approved, discounted products and sort by discount %
        List<Product> validDeals = allSoldProducts.stream()
            .filter(p -> "Approved".equals(p.getApprovalStatus()))
            .filter(p -> {
                boolean hasImage = p.getMedia() != null && !p.getMedia().isEmpty()
                    && p.getMedia().stream().anyMatch(m -> m.getFileName() != null && !m.getFileName().isEmpty());
                boolean hasPrice = (p.getRegularPrice() != null && p.getRegularPrice() >= 1)
                    || (p.getDiscountPrice() != null && p.getDiscountPrice() >= 1);
                boolean inStock = !"out".equalsIgnoreCase(p.getStatus())
                    && (p.getInitialStock() == null || p.getInitialStock() > 0);
                return hasImage && hasPrice && inStock;
            })
            .filter(p -> p.getDiscountPrice() != null && p.getRegularPrice() != null
                && p.getRegularPrice() > p.getDiscountPrice() && p.getDiscountPrice() >= 1)
            .sorted((a, b) -> {
                double discA = ((a.getRegularPrice() - a.getDiscountPrice()) / a.getRegularPrice()) * 100;
                double discB = ((b.getRegularPrice() - b.getDiscountPrice()) / b.getRegularPrice()) * 100;
                return Double.compare(discB, discA);
            })
            .limit(3)
            .collect(java.util.stream.Collectors.toList());

        // Reorder: second best (index 1) goes to center (hero position)
        if (validDeals.size() > 1) {
            Product second = validDeals.remove(1);
            validDeals.add(0, second);
        }

        return validDeals;
    }

    /**
     * Get trending products based on sales volume in the last 3 days.
     * Aggregates order quantities across all orders placed within the last 72 hours,
     * then returns the top-selling valid products.
     */
    public List<Product> getTrendingProducts() {
        long threeDaysAgo = System.currentTimeMillis() - (3 * 24 * 60 * 60 * 1000L);
        List<com.sreemarket.backend.model.Order> recentOrders = orderRepository.findByDatePlacedAfterOrderByDatePlacedAsc(threeDaysAgo);

        // Aggregate total quantity sold per product ID
        java.util.Map<Long, Long> productSales = new java.util.HashMap<>();
        for (com.sreemarket.backend.model.Order order : recentOrders) {
            if (order.getProductQuantities() != null) {
                for (java.util.Map.Entry<Long, Integer> entry : order.getProductQuantities().entrySet()) {
                    Long productId = entry.getKey();
                    int qty = entry.getValue() != null ? entry.getValue() : 0;
                    productSales.merge(productId, (long) qty, Long::sum);
                }
            }
        }

        if (productSales.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        // Sort product IDs by total sales (descending)
        List<Long> sortedProductIds = productSales.entrySet().stream()
            .sorted(java.util.Map.Entry.<Long, Long>comparingByValue().reversed())
            .map(java.util.Map.Entry::getKey)
            .collect(java.util.stream.Collectors.toList());

        // Fetch actual products and filter only valid ones
        List<Product> allProducts = productRepository.findAllById(sortedProductIds);
        java.util.Map<Long, Product> productMap = allProducts.stream()
            .collect(java.util.stream.Collectors.toMap(Product::getId, p -> p));

        List<Product> validProducts = new java.util.ArrayList<>();
        for (Long pid : sortedProductIds) {
            Product p = productMap.get(pid);
            if (p == null) continue;
            // Only include approved products
            if (!"Approved".equals(p.getApprovalStatus())) continue;
            // Must have a valid image
            boolean hasImage = p.getMedia() != null && !p.getMedia().isEmpty()
                && p.getMedia().stream().anyMatch(m -> m.getFileName() != null && !m.getFileName().isEmpty());
            // Must have a meaningful price (≥ ₹1)
            boolean hasPrice = (p.getRegularPrice() != null && p.getRegularPrice() >= 1)
                || (p.getDiscountPrice() != null && p.getDiscountPrice() >= 1);
            // Must be in stock
            boolean inStock = !"out".equalsIgnoreCase(p.getStatus())
                && (p.getInitialStock() == null || p.getInitialStock() > 0);
            if (hasImage && hasPrice && inStock) {
                validProducts.add(p);
            }
        }

        return validProducts.size() > 20 ? validProducts.subList(0, 20) : validProducts;
    }

    /**
     * Get featured products — products marked with isFeatured = true.
     * Filters to only valid products (has image, has price, in stock),
     * limits to 4, and returns them in a randomized order.
     */
    public List<Product> getFeaturedProducts() {
        List<Product> featured = productRepository.findByIsFeaturedTrueAndApprovalStatus("Approved");

        // Filter out invalid products (no image, no price, out of stock)
        List<Product> valid = featured.stream()
            .filter(p -> {
                boolean hasImage = p.getMedia() != null && !p.getMedia().isEmpty()
                    && p.getMedia().stream().anyMatch(m -> m.getFileName() != null && !m.getFileName().isEmpty());
                boolean hasPrice = (p.getRegularPrice() != null && p.getRegularPrice() >= 1)
                    || (p.getDiscountPrice() != null && p.getDiscountPrice() >= 1);
                boolean inStock = !"out".equalsIgnoreCase(p.getStatus())
                    && (p.getInitialStock() == null || p.getInitialStock() > 0);
                return hasImage && hasPrice && inStock;
            })
            .collect(java.util.stream.Collectors.toList());

        // Fallback: if no products are explicitly marked as featured,
        // return top 4 products by discount percentage (best deals)
        if (valid.isEmpty()) {
            List<Product> allApproved = productRepository.findByApprovalStatus("Approved");
            return allApproved.stream()
                .filter(p -> {
                    boolean hasImage = p.getMedia() != null && !p.getMedia().isEmpty()
                        && p.getMedia().stream().anyMatch(m -> m.getFileName() != null && !m.getFileName().isEmpty());
                    boolean hasPrice = (p.getRegularPrice() != null && p.getRegularPrice() >= 1)
                        || (p.getDiscountPrice() != null && p.getDiscountPrice() >= 1);
                    boolean inStock = !"out".equalsIgnoreCase(p.getStatus())
                        && (p.getInitialStock() == null || p.getInitialStock() > 0);
                    return hasImage && hasPrice && inStock;
                })
                .sorted((a, b) -> {
                    double discA = (a.getDiscountPrice() != null && a.getRegularPrice() != null && a.getRegularPrice() > a.getDiscountPrice())
                        ? ((a.getRegularPrice() - a.getDiscountPrice()) / a.getRegularPrice()) * 100
                        : 0;
                    double discB = (b.getDiscountPrice() != null && b.getRegularPrice() != null && b.getRegularPrice() > b.getDiscountPrice())
                        ? ((b.getRegularPrice() - b.getDiscountPrice()) / b.getRegularPrice()) * 100
                        : 0;
                    return Double.compare(discB, discA);
                })
                .limit(4)
                .collect(java.util.stream.Collectors.toList());
        }

        // Shuffle for randomized order
        java.util.Collections.shuffle(valid);

        // Limit to 4
        return valid.size() > 4 ? valid.subList(0, 4) : valid;
    }

    public List<Product> getNewArrivals() {
        long threeDaysAgo = System.currentTimeMillis() - (3 * 24 * 60 * 60 * 1000L);
        List<Product> recentProducts = productRepository.findByApprovalStatusAndCreatedAtAfter("Approved", threeDaysAgo);

        // Filter out invalid products
        List<Product> validProducts = recentProducts.stream()
            .filter(p -> {
                // Must have at least one image media with a valid fileName
                boolean hasImage = p.getMedia() != null && !p.getMedia().isEmpty()
                    && p.getMedia().stream().anyMatch(m -> m.getFileName() != null && !m.getFileName().isEmpty());
                // Must have a meaningful price (≥ ₹1 minimum — prevents ₹0.00 display from rounding)
                boolean hasPrice = (p.getRegularPrice() != null && p.getRegularPrice() >= 1)
                    || (p.getDiscountPrice() != null && p.getDiscountPrice() >= 1);
                // Must be in stock
                boolean inStock = !"out".equalsIgnoreCase(p.getStatus())
                    && (p.getInitialStock() == null || p.getInitialStock() > 0);
                return hasImage && hasPrice && inStock;
            })
            .collect(java.util.stream.Collectors.toList());

        if (validProducts.isEmpty()) {
            return validProducts;
        }

        // Compute category performance score based on aggregate bookingCount
        java.util.Map<String, Long> categoryPerformance = new java.util.HashMap<>();
        for (Product p : validProducts) {
            String cat = p.getCategory() != null ? p.getCategory() : "";
            categoryPerformance.merge(cat, p.getBookingCount() != null ? p.getBookingCount().longValue() : 0L, Long::sum);
        }

        // Sort: categories with higher total sales first, then by newest first
        validProducts.sort((a, b) -> {
            String catA = a.getCategory() != null ? a.getCategory() : "";
            String catB = b.getCategory() != null ? b.getCategory() : "";
            long perfA = categoryPerformance.getOrDefault(catA, 0L);
            long perfB = categoryPerformance.getOrDefault(catB, 0L);
            if (perfB != perfA) {
                return Long.compare(perfB, perfA); // Higher performance first
            }
            // Then by newest first
            return Long.compare(
                b.getCreatedAt() != null ? b.getCreatedAt() : 0L,
                a.getCreatedAt() != null ? a.getCreatedAt() : 0L
            );
        });

        // Limit to at most 12 products for the homepage
        return validProducts.size() > 12 ? validProducts.subList(0, 12) : validProducts;
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    public List<Product> getWholesaleProducts(String category, Double minPrice, Double maxPrice, String search) {
        List<Product> all = productRepository.findAll();
        return all.stream()
            .filter(p -> !"Rejected".equals(p.getApprovalStatus()))
            .filter(p -> Boolean.TRUE.equals(p.getSupportsWholesale()) || Boolean.TRUE.equals(p.getWholesaleOnly()))
            .filter(p -> {
                if (category != null && !category.isEmpty() && !category.equalsIgnoreCase(p.getCategory())) return false;
                double price = p.getWholesalePrice() != null ? p.getWholesalePrice() : 0;
                if (minPrice != null && price < minPrice) return false;
                if (maxPrice != null && price > maxPrice) return false;
                if (search != null && !search.isEmpty()
                    && !p.getName().toLowerCase().contains(search.toLowerCase())) return false;
                return true;
            })
            .collect(java.util.stream.Collectors.toList());
    }

    public Product getApprovedProductById(Long id) {
        Product product = getProductById(id);
        if (!"Approved".equals(product.getApprovalStatus())) {
            throw new RuntimeException("Product not found with id: " + id);
        }
        return product;
    }

    @Transactional
    public Product updateProduct(Long id, Product productData, List<MultipartFile> mediaFiles,
            List<MultipartFile> manufacturerFiles, List<String> videoUrls,
            List<Long> manufacturerMediaIds, List<MultipartFile> policyFiles) throws IOException {
        return updateProduct(id, productData, mediaFiles, manufacturerFiles, videoUrls,
                manufacturerMediaIds, policyFiles, null, null, null, null);
    }

    @Transactional
    public Product updateProduct(Long id, Product productData, List<MultipartFile> mediaFiles,
            List<MultipartFile> manufacturerFiles, List<String> videoUrls,
            List<Long> manufacturerMediaIds, List<MultipartFile> policyFiles,
            List<String> instagramUrls) throws IOException {
        return updateProduct(id, productData, mediaFiles, manufacturerFiles, videoUrls,
                manufacturerMediaIds, policyFiles, instagramUrls, null, null, null);
    }

    public Product updateProduct(Long id, Product productData, List<MultipartFile> mediaFiles,
            List<MultipartFile> manufacturerFiles, List<String> videoUrls,
            List<Long> manufacturerMediaIds, List<MultipartFile> policyFiles,
            List<String> instagramUrls,
            java.util.Map<Integer, List<MultipartFile>> variationMediaMap) throws IOException {
        return updateProduct(id, productData, mediaFiles, manufacturerFiles, videoUrls,
                manufacturerMediaIds, policyFiles, instagramUrls, null, null, variationMediaMap);
    }

    public Product updateProduct(Long id, Product productData, List<MultipartFile> mediaFiles,
            List<MultipartFile> manufacturerFiles, List<String> videoUrls,
            List<Long> manufacturerMediaIds, List<MultipartFile> policyFiles,
            List<String> instagramUrls,
            List<MultipartFile> instagramThumbnailFiles,
            java.util.List<Integer> instagramThumbnailIndices,
            java.util.Map<Integer, List<MultipartFile>> variationMediaMap) throws IOException {
        Product existingProduct = getProductById(id);

        // Validate vendor approval before allowing product update
        vendorService.ensureVendorIsApproved(existingProduct.getVendorId());

        // Update basic fields
        existingProduct.setName(productData.getName());
        existingProduct.setType(productData.getType());
        existingProduct.setCategory(productData.getCategory());
        existingProduct.setSubCategory(productData.getSubCategory());
        existingProduct.setBrand(productData.getBrand());
        existingProduct.setShortDescription(productData.getShortDescription());
        existingProduct.setDescription(productData.getDescription());
        existingProduct.setSku(productData.getSku());

        // Update Pricing
        existingProduct.setRegularPrice(productData.getRegularPrice());
        existingProduct.setDiscountPrice(productData.getDiscountPrice());
        existingProduct.setSupportsWholesale(productData.getSupportsWholesale());
        existingProduct.setWholesalePrice(productData.getWholesalePrice());
        existingProduct.setMinimumWholesaleQuantity(productData.getMinimumWholesaleQuantity());
        existingProduct.setWholesaleDiscountType(productData.getWholesaleDiscountType());
        existingProduct.setWholesaleOnly(productData.getWholesaleOnly());

        // Update Inventory & Status
        Integer oldStock = existingProduct.getInitialStock();
        Integer newStock = productData.getInitialStock();
        existingProduct.setInitialStock(newStock);
        existingProduct.setStatus(productData.getStatus());

        // Reset approval status to Pending for admin re-approval on vendor edit
        existingProduct.setApprovalStatus("Pending");

        // Log stock movement if changed
        if (newStock != null && (oldStock == null || !newStock.equals(oldStock))) {
            int diff = newStock - (oldStock != null ? oldStock : 0);
            String movementType = diff > 0 ? "IN" : "OUT";
            try {
                stockMovementService.logFromProduct(existingProduct, existingProduct.getVendorId(),
                    movementType, Math.abs(diff),
                    oldStock, newStock,
                    "Product update", "Vendor", "Stock changed during product update");
            } catch (Exception ignored) {}

            if (newStock == 0) {
                Notification notification = new Notification();
                notification.setVendorId(existingProduct.getVendorId());
                notification.setTitle("Out of Stock");
                notification.setMessage("Product " + existingProduct.getName() + " is now out of stock.");
                notification.setType("OUT_OF_STOCK");
                notificationService.createNotification(notification);
            } else if (newStock <= 5) {
                Notification notification = new Notification();
                notification.setVendorId(existingProduct.getVendorId());
                notification.setTitle("Low Stock Warning");
                notification.setMessage(
                        "Product " + existingProduct.getName() + " has low stock (" + newStock + " remaining).");
                notification.setType("LOW_STOCK");
                notificationService.createNotification(notification);
            }
        }

        // Update Manufacturer Layout
        existingProduct.setManufacturerLayout(productData.getManufacturerLayout());

        // Update Instagram Feed Config
        existingProduct.setInstagramFeedLayout(productData.getInstagramFeedLayout());
        existingProduct.setInstagramFeedConfig(productData.getInstagramFeedConfig());

        // Update Shipping & Tax
        existingProduct.setWeight(productData.getWeight());
        existingProduct.setLength(productData.getLength());
        existingProduct.setWidth(productData.getWidth());
        existingProduct.setHeight(productData.getHeight());
        existingProduct.setShippingClass(productData.getShippingClass());
        existingProduct.setTaxStatus(productData.getTaxStatus());
        existingProduct.setTaxClass(productData.getTaxClass());

        // Note: For a complete update, we would also need to carefully merge/replace
        // complex nested collections:
        // existingProduct.getAttributes().clear();
        // existingProduct.getAttributes().addAll(productData.getAttributes());
        // For iteration speed/simplicity here, we rely on the assumption that complex
        // updates drop and re-insert or carefully merge.
        // If the frontend resends the entire complex structure, replacing is simplest:

        if (productData.getAttributes() != null) {
            existingProduct.getAttributes().clear();
            productData.getAttributes().forEach(a -> {
                a.setProduct(existingProduct);
                existingProduct.getAttributes().add(a);
            });
        }
        if (productData.getVariations() != null) {
            existingProduct.getVariations().clear();
            productData.getVariations().forEach(v -> {
                v.setProduct(existingProduct);
                existingProduct.getVariations().add(v);
            });
        }
        if (productData.getTags() != null) {
            existingProduct.getTags().clear();
            productData.getTags().forEach(t -> {
                t.setProduct(existingProduct);
                existingProduct.getTags().add(t);
            });
        }
        if (productData.getLinkedProducts() != null) {
            existingProduct.getLinkedProducts().clear();
            productData.getLinkedProducts().forEach(l -> {
                l.setProduct(existingProduct);
                existingProduct.getLinkedProducts().add(l);
            });
        }
        if (productData.getPricingTiers() != null) {
            existingProduct.getPricingTiers().clear();
            productData.getPricingTiers().forEach(t -> {
                t.setProduct(existingProduct);
                existingProduct.getPricingTiers().add(t);
            });
        }

        // --- NEW: Sync Media List (Deletions, Primary Status & New Metadata) ---
        if (productData.getMedia() != null) {
            List<Long> keptMediaIds = new ArrayList<>();
            for (ProductMedia m : productData.getMedia()) {
                if (m.getId() != null) {
                    keptMediaIds.add(m.getId());
                }
            }
            // Preserve existing manufacturer media
            if (manufacturerMediaIds != null) {
                keptMediaIds.addAll(manufacturerMediaIds);
            }

            // Remove those not in kept list (orphanRemoval will handle DB deletion)
            existingProduct.getMedia().removeIf(m -> m.getId() != null && !keptMediaIds.contains(m.getId()));

            // Update primary status and mediaType for existing images
            for (ProductMedia existingMedia : existingProduct.getMedia()) {
                for (ProductMedia incomingMedia : productData.getMedia()) {
                    if (existingMedia.getId().equals(incomingMedia.getId())) {
                        existingMedia.setIsPrimary(Boolean.TRUE.equals(incomingMedia.getIsPrimary()));
                        existingMedia.setMediaType(incomingMedia.getMediaType());
                        break;
                    }
                }
            }

            // Bring in metadata for NEW images so saveProduct can pair them with files
            for (ProductMedia incomingMedia : productData.getMedia()) {
                if (incomingMedia.getId() == null) {
                    incomingMedia.setProduct(existingProduct);
                    existingProduct.getMedia().add(incomingMedia);
                }
            }
        }

        // Remove old video URL media records (they will be replaced by new URLs)
        if (videoUrls != null) {
            existingProduct.getMedia().removeIf(m -> "video-gallery".equals(m.getMediaType()) && "video-url".equals(m.getFileType()));
        }

        // Preserve existing Instagram custom thumbnails before removing old records
        java.util.List<String> existingCustomThumbnails = new java.util.ArrayList<>();
        if (instagramUrls != null) {
            for (ProductMedia m : existingProduct.getMedia()) {
                if ("instagram".equals(m.getMediaType()) && "instagram-url".equals(m.getFileType())) {
                    existingCustomThumbnails.add(m.getCustomThumbnail());
                }
            }
            existingProduct.getMedia().removeIf(m -> "instagram".equals(m.getMediaType()) && "instagram-url".equals(m.getFileType()));
        }

        // We can reuse the save logic to append new media/policies if passing the
        // existingProduct object
        Product saved = saveProduct(existingProduct, existingProduct.getVendorId(), mediaFiles, manufacturerFiles, videoUrls, policyFiles, instagramUrls, instagramThumbnailFiles, instagramThumbnailIndices, variationMediaMap);

        // Re-apply preserved custom thumbnails to new Instagram media entries for indices
        // that don't have a new thumbnail file uploaded
        if (instagramUrls != null && !existingCustomThumbnails.isEmpty()) {
            List<ProductMedia> newInstaMedia = saved.getMedia().stream()
                    .filter(m -> "instagram".equals(m.getMediaType()) && "instagram-url".equals(m.getFileType()))
                    .collect(java.util.stream.Collectors.toList());
            for (int i = 0; i < newInstaMedia.size() && i < existingCustomThumbnails.size(); i++) {
                String existingThumb = existingCustomThumbnails.get(i);
                if (existingThumb != null && !existingThumb.isEmpty()
                        && newInstaMedia.get(i).getCustomThumbnail() == null) {
                    newInstaMedia.get(i).setCustomThumbnail(existingThumb);
                }
            }
            saved = productRepository.save(saved);
        }

        // Log vendor activity for product update
        try {
            Vendor vendor = vendorService.getVendorById(saved.getVendorId());
            vendorActivityService.logActivity(vendor.getId(), vendor.getFullName(),
                    "product_updated",
                    "Updated product: " + saved.getName(),
                    null);
        } catch (Exception ignored) {}

        return saved;
    }
}
