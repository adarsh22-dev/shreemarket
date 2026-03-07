package com.sreemarket.backend.service;

import com.sreemarket.backend.model.*;
import com.sreemarket.backend.model.Notification;
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

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private NotificationService notificationService;

    private final String UPLOAD_DIR = "uploads/products/";

    @Transactional
    public Product saveProduct(Product product, Long vendorId, List<MultipartFile> mediaFiles,
            List<MultipartFile> policyFiles) throws IOException {

        // Set vendor ID directly
        if (vendorId != null) {
            product.setVendorId(vendorId);
        }

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

        // Save the base entity first
        Product savedProduct = productRepository.save(product);

        // Process file uploads
        File uploadDirectory = new File(UPLOAD_DIR);
        if (!uploadDirectory.exists()) {
            uploadDirectory.mkdirs();
        }

        // Process Media - Only if new files are provided
        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            List<ProductMedia> metadataList = product.getMedia();
            // Filter metadata to find only entries intended for new files (isNew=true or
            // id=null)
            List<ProductMedia> newMediaMetadata = new ArrayList<>();
            if (metadataList != null) {
                for (ProductMedia m : metadataList) {
                    if (m.getId() == null) {
                        newMediaMetadata.add(m);
                    }
                }
            }

            for (int i = 0; i < mediaFiles.size(); i++) {
                MultipartFile file = mediaFiles.get(i);
                if (!file.isEmpty()) {
                    String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                    Path filePath = Paths.get(UPLOAD_DIR, fileName);
                    Files.copy(file.getInputStream(), filePath);

                    ProductMedia media;
                    if (i < newMediaMetadata.size()) {
                        // Use the metadata object that came from JSON
                        media = newMediaMetadata.get(i);
                    } else {
                        // Fallback if metadata wasn't provided correctly
                        media = new ProductMedia();
                        // If no image is primary yet, and this is the first file, make it primary
                        boolean hasPrimary = savedProduct.getMedia().stream()
                                .anyMatch(m -> Boolean.TRUE.equals(m.getIsPrimary()));
                        media.setIsPrimary(!hasPrimary);
                    }

                    media.setProduct(savedProduct);
                    media.setFileName(fileName);
                    media.setFileType(
                            file.getContentType() != null && file.getContentType().startsWith("video/") ? "video"
                                    : "image");

                    if (!savedProduct.getMedia().contains(media)) {
                        savedProduct.getMedia().add(media);
                    }
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
                    Path filePath = Paths.get(UPLOAD_DIR, fileName);
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

        return productRepository.save(savedProduct); // Save again with files
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> searchProducts(String query) {
        return productRepository.findByNameContainingIgnoreCase(query);
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

    public void deleteProduct(Long id) {
        if (productRepository.existsById(id)) {
            // Note: In a production environment, you might also want to delete the physical
            // files from the UPLOAD_DIR
            productRepository.deleteById(id);
        } else {
            throw new RuntimeException("Product not found with id: " + id);
        }
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
    public List<Product> uploadProductsBulk(MultipartFile file, Long vendorId) throws IOException {
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
                    product.setStatus("in"); // Default status
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

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    @Transactional
    public Product updateProduct(Long id, Product productData, List<MultipartFile> mediaFiles,
            List<MultipartFile> policyFiles) throws IOException {
        Product existingProduct = getProductById(id);

        // Update basic fields
        existingProduct.setName(productData.getName());
        existingProduct.setType(productData.getType());
        existingProduct.setCategory(productData.getCategory());
        existingProduct.setBrand(productData.getBrand());
        existingProduct.setShortDescription(productData.getShortDescription());
        existingProduct.setDescription(productData.getDescription());
        existingProduct.setSku(productData.getSku());

        // Update Pricing
        existingProduct.setRegularPrice(productData.getRegularPrice());
        existingProduct.setDiscountPrice(productData.getDiscountPrice());
        existingProduct.setSupportsWholesale(productData.getSupportsWholesale());
        existingProduct.setWholesaleDiscountType(productData.getWholesaleDiscountType());

        // Update Inventory & Status
        Integer oldStock = existingProduct.getInitialStock();
        Integer newStock = productData.getInitialStock();
        existingProduct.setInitialStock(newStock);
        existingProduct.setStatus(productData.getStatus());

        // Notify if stock becomes low or out
        if (newStock != null && (oldStock == null || !newStock.equals(oldStock))) {
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

        // --- NEW: Sync Media List (Deletions, Primary Status & New Metadata) ---
        if (productData.getMedia() != null) {
            List<Long> keptMediaIds = new ArrayList<>();
            for (ProductMedia m : productData.getMedia()) {
                if (m.getId() != null) {
                    keptMediaIds.add(m.getId());
                }
            }

            // Remove those not in kept list (orphanRemoval will handle DB deletion)
            existingProduct.getMedia().removeIf(m -> m.getId() != null && !keptMediaIds.contains(m.getId()));

            // Update primary status for existing images
            for (ProductMedia existingMedia : existingProduct.getMedia()) {
                for (ProductMedia incomingMedia : productData.getMedia()) {
                    if (existingMedia.getId().equals(incomingMedia.getId())) {
                        existingMedia.setIsPrimary(Boolean.TRUE.equals(incomingMedia.getIsPrimary()));
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

        // We can reuse the save logic to append new media/policies if passing the
        // existingProduct object
        return saveProduct(existingProduct, existingProduct.getVendorId(), mediaFiles, policyFiles);
    }
}
