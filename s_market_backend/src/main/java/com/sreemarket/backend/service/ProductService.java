package com.sreemarket.backend.service;

import com.sreemarket.backend.model.*;
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
            // Check if there's already a primary image
            boolean hasPrimary = savedProduct.getMedia().stream().anyMatch(m -> Boolean.TRUE.equals(m.getIsPrimary()));

            for (MultipartFile file : mediaFiles) {
                if (!file.isEmpty()) {
                    String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                    Path filePath = Paths.get(UPLOAD_DIR, fileName);
                    Files.copy(file.getInputStream(), filePath);

                    ProductMedia media = new ProductMedia();
                    media.setProduct(savedProduct);
                    media.setFileName(fileName);
                    media.setFileType(
                            file.getContentType() != null && file.getContentType().startsWith("video/") ? "video"
                                    : "image");

                    // If no image is primary yet, make this one primary
                    media.setIsPrimary(!hasPrimary);
                    hasPrimary = true;

                    savedProduct.getMedia().add(media);
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
        existingProduct.setInitialStock(productData.getInitialStock());
        existingProduct.setStatus(productData.getStatus());

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

        // --- NEW: Sync Media List (Deletions & Primary Status) ---
        if (productData.getMedia() != null) {
            List<Long> keptMediaIds = new ArrayList<>();
            for (ProductMedia m : productData.getMedia()) {
                if (m.getId() != null) {
                    keptMediaIds.add(m.getId());
                }
            }

            // Remove those not in kept list (orphanRemoval will handle DB deletion)
            existingProduct.getMedia().removeIf(m -> m.getId() != null && !keptMediaIds.contains(m.getId()));

            // Update primary status for existing images based on the new order from
            // frontend
            if (!productData.getMedia().isEmpty()) {
                ProductMedia metadata0 = productData.getMedia().get(0);
                if (metadata0.getId() != null) {
                    // One of the existing images is now primary
                    for (ProductMedia m : existingProduct.getMedia()) {
                        m.setIsPrimary(m.getId().equals(metadata0.getId()));
                    }
                } else {
                    // The first item is a NEW image (id is null).
                    // Set all existing ones to NOT primary.
                    // saveProduct will then make the first new file primary.
                    for (ProductMedia m : existingProduct.getMedia()) {
                        m.setIsPrimary(false);
                    }
                }
            }
        }

        // We can reuse the save logic to append new media/policies if passing the
        // existingProduct object
        return saveProduct(existingProduct, existingProduct.getVendorId(), mediaFiles, policyFiles);
    }
}
