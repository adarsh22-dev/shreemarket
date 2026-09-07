package com.sreemarket.backend.service;

import com.sreemarket.backend.model.*;
import com.sreemarket.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TrashService {

    @Autowired private ProductRepository productRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private VendorRepository vendorRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private SubCategoryRepository subCategoryRepository;
    @Autowired private BrandRepository brandRepository;
    @Autowired private CouponRepository couponRepository;
    @Autowired private ShippingZoneRepository shippingZoneRepository;
    @Autowired private TaxRateRepository taxRateRepository;
    @Autowired private DeliveryPartnerRepository deliveryPartnerRepository;
    @Autowired private BlogPostRepository blogPostRepository;
    @Autowired private FaqRepository faqRepository;
    @Autowired private BannerRepository bannerRepository;
    @Autowired private FlashSaleRepository flashSaleRepository;
    @Autowired private TestimonialRepository testimonialRepository;
    @Autowired private SizeGuideRepository sizeGuideRepository;

    private static final long NINETY_DAYS_MS = 90L * 24 * 60 * 60 * 1000;

    public Page<Map<String, Object>> getTrashedItems(String type, String search, int page, int size) {
        List<Map<String, Object>> allItems = new ArrayList<>();

        if (type == null || type.isEmpty() || "products".equals(type)) {
            addTrashedProducts(allItems, search);
        }
        if (type == null || type.isEmpty() || "vendors".equals(type)) {
            addTrashedVendors(allItems, search);
        }
        if (type == null || type.isEmpty() || "customers".equals(type)) {
            addTrashedCustomers(allItems, search);
        }
        if (type == null || type.isEmpty() || "categories".equals(type)) {
            addTrashedCategories(allItems, search);
        }
        if (type == null || type.isEmpty() || "brands".equals(type)) {
            addTrashedBrands(allItems, search);
        }
        if (type == null || type.isEmpty() || "coupons".equals(type)) {
            addTrashedCoupons(allItems, search);
        }
        if (type == null || type.isEmpty() || "shipping-zones".equals(type)) {
            addTrashedShippingZones(allItems, search);
        }
        if (type == null || type.isEmpty() || "tax-rates".equals(type)) {
            addTrashedTaxRates(allItems, search);
        }
        if (type == null || type.isEmpty() || "delivery-partners".equals(type)) {
            addTrashedDeliveryPartners(allItems, search);
        }
        if (type == null || type.isEmpty() || "blog-posts".equals(type)) {
            addTrashedBlogPosts(allItems, search);
        }
        if (type == null || type.isEmpty() || "faqs".equals(type)) {
            addTrashedFaqs(allItems, search);
        }
        if (type == null || type.isEmpty() || "banners".equals(type)) {
            addTrashedBanners(allItems, search);
        }
        if (type == null || type.isEmpty() || "flash-sales".equals(type)) {
            addTrashedFlashSales(allItems, search);
        }
        if (type == null || type.isEmpty() || "testimonials".equals(type)) {
            addTrashedTestimonials(allItems, search);
        }
        if (type == null || type.isEmpty() || "size-guides".equals(type)) {
            addTrashedSizeGuides(allItems, search);
        }

        // Sort by deletedAt descending
        allItems.sort((a, b) -> {
            Long da = (Long) a.get("deletedAt");
            Long db = (Long) b.get("deletedAt");
            return Long.compare(db != null ? db : 0L, da != null ? da : 0L);
        });

        // Manual pagination
        int start = page * size;
        int end = Math.min(start + size, allItems.size());
        List<Map<String, Object>> paged = start < allItems.size() ? allItems.subList(start, end) : new ArrayList<>();

        return new PageImpl<>(paged, PageRequest.of(page, size), allItems.size());
    }

    @Transactional
    public Map<String, Object> restoreItem(String type, Long id) {
        switch (type) {
            case "products":
                Product product = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found"));
                product.setDeleted(false);
                product.setDeletedAt(null);
                productRepository.save(product);
                return Map.of("type", "Product", "name", product.getName());
            case "vendors":
                Vendor vendor = vendorRepository.findById(id).orElseThrow(() -> new RuntimeException("Vendor not found"));
                vendor.setDeleted(false);
                vendor.setDeletedAt(null);
                vendorRepository.save(vendor);
                return Map.of("type", "Vendor", "name", vendor.getFullName());
            case "customers":
                User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found"));
                user.setDeleted(false);
                user.setDeletedAt(null);
                userRepository.save(user);
                return Map.of("type", "Customer", "name", user.getFullName());
            case "categories":
                Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Category not found"));
                category.setDeleted(false);
                category.setDeletedAt(null);
                categoryRepository.save(category);
                return Map.of("type", "Category", "name", category.getName());
            case "brands":
                Brand brand = brandRepository.findById(id).orElseThrow(() -> new RuntimeException("Brand not found"));
                brand.setDeleted(false);
                brand.setDeletedAt(null);
                brandRepository.save(brand);
                return Map.of("type", "Brand", "name", brand.getName());
            case "coupons":
                Coupon coupon = couponRepository.findById(id).orElseThrow(() -> new RuntimeException("Coupon not found"));
                coupon.setDeleted(false);
                coupon.setDeletedAt(null);
                couponRepository.save(coupon);
                return Map.of("type", "Coupon", "name", coupon.getCode());
            case "shipping-zones":
                ShippingZone zone = shippingZoneRepository.findById(id).orElseThrow(() -> new RuntimeException("Shipping zone not found"));
                zone.setDeleted(false);
                zone.setDeletedAt(null);
                shippingZoneRepository.save(zone);
                return Map.of("type", "Shipping Zone", "name", zone.getName());
            case "tax-rates":
                TaxRate taxRate = taxRateRepository.findById(id).orElseThrow(() -> new RuntimeException("Tax rate not found"));
                taxRate.setDeleted(false);
                taxRate.setDeletedAt(null);
                taxRateRepository.save(taxRate);
                return Map.of("type", "Tax Rate", "name", taxRate.getName());
            case "delivery-partners":
                DeliveryPartner dp = deliveryPartnerRepository.findById(id).orElseThrow(() -> new RuntimeException("Delivery partner not found"));
                dp.setDeleted(false);
                dp.setDeletedAt(null);
                deliveryPartnerRepository.save(dp);
                return Map.of("type", "Delivery Partner", "name", dp.getName());
            case "blog-posts":
                BlogPost bp = blogPostRepository.findById(id).orElseThrow(() -> new RuntimeException("Blog post not found"));
                bp.setDeleted(false);
                bp.setDeletedAt(null);
                blogPostRepository.save(bp);
                return Map.of("type", "Blog Post", "name", bp.getTitle());
            case "faqs":
                Faq faq = faqRepository.findById(id).orElseThrow(() -> new RuntimeException("FAQ not found"));
                faq.setDeleted(false);
                faq.setDeletedAt(null);
                faqRepository.save(faq);
                return Map.of("type", "FAQ", "name", faq.getQuestion());
            case "banners":
                Banner banner = bannerRepository.findById(id).orElseThrow(() -> new RuntimeException("Banner not found"));
                banner.setDeleted(false);
                banner.setDeletedAt(null);
                bannerRepository.save(banner);
                return Map.of("type", "Banner", "name", banner.getTitle());
            case "flash-sales":
                FlashSale fs = flashSaleRepository.findById(id).orElseThrow(() -> new RuntimeException("Flash sale not found"));
                fs.setDeleted(false);
                fs.setDeletedAt(null);
                flashSaleRepository.save(fs);
                return Map.of("type", "Flash Sale", "name", fs.getName());
            case "testimonials":
                Testimonial t = testimonialRepository.findById(id).orElseThrow(() -> new RuntimeException("Testimonial not found"));
                t.setDeleted(false);
                t.setDeletedAt(null);
                testimonialRepository.save(t);
                return Map.of("type", "Testimonial", "name", t.getReviewerName());
            case "size-guides":
                SizeGuide sg = sizeGuideRepository.findById(id).orElseThrow(() -> new RuntimeException("Size guide not found"));
                sg.setDeleted(false);
                sg.setDeletedAt(null);
                sizeGuideRepository.save(sg);
                return Map.of("type", "Size Guide", "name", sg.getName());
            default:
                throw new RuntimeException("Unknown trash type: " + type);
        }
    }

    @Transactional
    public void permanentDelete(String type, Long id) {
        switch (type) {
            case "products":
                productRepository.deleteById(id);
                break;
            case "vendors":
                vendorRepository.deleteById(id);
                break;
            case "customers":
                userRepository.deleteById(id);
                break;
            case "categories":
                categoryRepository.deleteById(id);
                break;
            case "brands":
                brandRepository.deleteById(id);
                break;
            case "coupons":
                couponRepository.deleteById(id);
                break;
            case "shipping-zones":
                shippingZoneRepository.deleteById(id);
                break;
            case "tax-rates":
                taxRateRepository.deleteById(id);
                break;
            case "delivery-partners":
                deliveryPartnerRepository.deleteById(id);
                break;
            case "blog-posts":
                blogPostRepository.deleteById(id);
                break;
            case "faqs":
                faqRepository.deleteById(id);
                break;
            case "banners":
                bannerRepository.deleteById(id);
                break;
            case "flash-sales":
                flashSaleRepository.deleteById(id);
                break;
            case "testimonials":
                testimonialRepository.deleteById(id);
                break;
            case "size-guides":
                sizeGuideRepository.deleteById(id);
                break;
            default:
                throw new RuntimeException("Unknown trash type: " + type);
        }
    }

    @Transactional
    public int emptyTrash() {
        int count = 0;
        count += emptyProducts();
        count += emptyVendors();
        count += emptyCustomers();
        count += emptyCategories();
        count += emptyBrands();
        count += emptyCoupons();
        count += emptyShippingZones();
        count += emptyTaxRates();
        count += emptyDeliveryPartners();
        count += emptyBlogPosts();
        count += emptyFaqs();
        count += emptyBanners();
        count += emptyFlashSales();
        count += emptyTestimonials();
        count += emptySizeGuides();
        return count;
    }

    public Map<String, Object> getTrashStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("products", productRepository.countByDeletedTrue());
        stats.put("vendors", vendorRepository.countByDeletedTrue());
        stats.put("customers", userRepository.countByDeletedTrue());
        stats.put("categories", categoryRepository.countByDeletedTrue());
        stats.put("brands", brandRepository.countByDeletedTrue());
        stats.put("coupons", couponRepository.countByDeletedTrue());
        stats.put("shippingZones", shippingZoneRepository.countByDeletedTrue());
        stats.put("taxRates", taxRateRepository.countByDeletedTrue());
        stats.put("deliveryPartners", deliveryPartnerRepository.countByDeletedTrue());
        stats.put("blogPosts", blogPostRepository.countByDeletedTrue());
        stats.put("faqs", faqRepository.countByDeletedTrue());
        stats.put("banners", bannerRepository.countByDeletedTrue());
        stats.put("flashSales", flashSaleRepository.countByDeletedTrue());
        stats.put("testimonials", testimonialRepository.countByDeletedTrue());
        stats.put("sizeGuides", sizeGuideRepository.countByDeletedTrue());

        long total = stats.values().stream().mapToLong(v -> (Long) v).sum();
        stats.put("total", total);
        return stats;
    }

    // Auto-purge items older than 30 days
    @Transactional
    public int autoPurgeOldTrash() {
        long cutoff = System.currentTimeMillis() - NINETY_DAYS_MS;
        int count = 0;
        count += purgeOldItems(productRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(vendorRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(userRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(categoryRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(brandRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(couponRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(shippingZoneRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(taxRateRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(deliveryPartnerRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(blogPostRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(faqRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(bannerRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(flashSaleRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(testimonialRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        count += purgeOldItems(sizeGuideRepository.findAllByDeletedTrueAndDeletedAtLessThan(cutoff));
        return count;
    }

    private <T> int purgeOldItems(List<T> items) {
        for (T item : items) {
            if (item instanceof Product) productRepository.delete((Product) item);
            else if (item instanceof Vendor) vendorRepository.delete((Vendor) item);
            else if (item instanceof User) userRepository.delete((User) item);
            else if (item instanceof Category) categoryRepository.delete((Category) item);
            else if (item instanceof Brand) brandRepository.delete((Brand) item);
            else if (item instanceof Coupon) couponRepository.delete((Coupon) item);
            else if (item instanceof ShippingZone) shippingZoneRepository.delete((ShippingZone) item);
            else if (item instanceof TaxRate) taxRateRepository.delete((TaxRate) item);
            else if (item instanceof DeliveryPartner) deliveryPartnerRepository.delete((DeliveryPartner) item);
            else if (item instanceof BlogPost) blogPostRepository.delete((BlogPost) item);
            else if (item instanceof Faq) faqRepository.delete((Faq) item);
            else if (item instanceof Banner) bannerRepository.delete((Banner) item);
            else if (item instanceof FlashSale) flashSaleRepository.delete((FlashSale) item);
            else if (item instanceof Testimonial) testimonialRepository.delete((Testimonial) item);
            else if (item instanceof SizeGuide) sizeGuideRepository.delete((SizeGuide) item);
        }
        return items.size();
    }

    // ── Helper methods to collect trashed items ──

    private void addTrashedProducts(List<Map<String, Object>> items, String search) {
        List<Product> trashed = search != null && !search.isEmpty()
            ? productRepository.findByDeletedTrueAndNameContainingIgnoreCase(search)
            : productRepository.findByDeletedTrue();
        for (Product p : trashed) {
            items.add(buildItem("products", p.getId(), "Product", p.getName(), p.getDeletedAt(), p.getStatus()));
        }
    }

    private void addTrashedVendors(List<Map<String, Object>> items, String search) {
        List<Vendor> trashed = search != null && !search.isEmpty()
            ? vendorRepository.findByDeletedTrueAndFullNameContainingIgnoreCase(search)
            : vendorRepository.findByDeletedTrue();
        for (Vendor v : trashed) {
            items.add(buildItem("vendors", v.getId(), "Vendor", v.getFullName(), v.getDeletedAt(), v.getStatus()));
        }
    }

    private void addTrashedCustomers(List<Map<String, Object>> items, String search) {
        List<User> trashed = search != null && !search.isEmpty()
            ? userRepository.findByDeletedTrueAndFullNameContainingIgnoreCase(search)
            : userRepository.findByDeletedTrue();
        for (User u : trashed) {
            items.add(buildItem("customers", u.getId(), "Customer", u.getFullName(), u.getDeletedAt(), u.getStatus()));
        }
    }

    private void addTrashedCategories(List<Map<String, Object>> items, String search) {
        List<Category> trashed = search != null && !search.isEmpty()
            ? categoryRepository.findByDeletedTrueAndNameContainingIgnoreCase(search)
            : categoryRepository.findByDeletedTrue();
        for (Category c : trashed) {
            items.add(buildItem("categories", c.getId(), "Category", c.getName(), c.getDeletedAt(), c.getStatus()));
        }
    }

    private void addTrashedBrands(List<Map<String, Object>> items, String search) {
        List<Brand> trashed = search != null && !search.isEmpty()
            ? brandRepository.findByDeletedTrueAndNameContainingIgnoreCase(search)
            : brandRepository.findByDeletedTrue();
        for (Brand b : trashed) {
            items.add(buildItem("brands", b.getId(), "Brand", b.getName(), b.getDeletedAt(), b.getStatus()));
        }
    }

    private void addTrashedCoupons(List<Map<String, Object>> items, String search) {
        List<Coupon> trashed = search != null && !search.isEmpty()
            ? couponRepository.findByDeletedTrueAndCodeContainingIgnoreCase(search)
            : couponRepository.findByDeletedTrue();
        for (Coupon c : trashed) {
            items.add(buildItem("coupons", c.getId(), "Coupon", c.getCode(), c.getDeletedAt(), c.getStatus()));
        }
    }

    private void addTrashedShippingZones(List<Map<String, Object>> items, String search) {
        List<ShippingZone> trashed = search != null && !search.isEmpty()
            ? shippingZoneRepository.findByDeletedTrueAndNameContainingIgnoreCase(search)
            : shippingZoneRepository.findByDeletedTrue();
        for (ShippingZone z : trashed) {
            items.add(buildItem("shipping-zones", z.getId(), "Shipping Zone", z.getName(), z.getDeletedAt(), z.getDeliveryType()));
        }
    }

    private void addTrashedTaxRates(List<Map<String, Object>> items, String search) {
        List<TaxRate> trashed = search != null && !search.isEmpty()
            ? taxRateRepository.findByDeletedTrueAndNameContainingIgnoreCase(search)
            : taxRateRepository.findByDeletedTrue();
        for (TaxRate t : trashed) {
            items.add(buildItem("tax-rates", t.getId(), "Tax Rate", t.getName(), t.getDeletedAt(), t.getStatus()));
        }
    }

    private void addTrashedDeliveryPartners(List<Map<String, Object>> items, String search) {
        List<DeliveryPartner> trashed = search != null && !search.isEmpty()
            ? deliveryPartnerRepository.findByDeletedTrueAndNameContainingIgnoreCase(search)
            : deliveryPartnerRepository.findByDeletedTrue();
        for (DeliveryPartner dp : trashed) {
            items.add(buildItem("delivery-partners", dp.getId(), "Delivery Partner", dp.getName(), dp.getDeletedAt(), dp.getStatus()));
        }
    }

    private void addTrashedBlogPosts(List<Map<String, Object>> items, String search) {
        List<BlogPost> trashed = search != null && !search.isEmpty()
            ? blogPostRepository.findByDeletedTrueAndTitleContainingIgnoreCase(search)
            : blogPostRepository.findByDeletedTrue();
        for (BlogPost bp : trashed) {
            items.add(buildItem("blog-posts", bp.getId(), "Blog Post", bp.getTitle(), bp.getDeletedAt(), bp.getStatus()));
        }
    }

    private void addTrashedFaqs(List<Map<String, Object>> items, String search) {
        List<Faq> trashed = search != null && !search.isEmpty()
            ? faqRepository.findByDeletedTrueAndQuestionContainingIgnoreCase(search)
            : faqRepository.findByDeletedTrue();
        for (Faq f : trashed) {
            items.add(buildItem("faqs", f.getId(), "FAQ", f.getQuestion(), f.getDeletedAt(), f.getStatus()));
        }
    }

    private void addTrashedBanners(List<Map<String, Object>> items, String search) {
        List<Banner> trashed = search != null && !search.isEmpty()
            ? bannerRepository.findByDeletedTrueAndTitleContainingIgnoreCase(search)
            : bannerRepository.findByDeletedTrue();
        for (Banner b : trashed) {
            items.add(buildItem("banners", b.getId(), "Banner", b.getTitle(), b.getDeletedAt(), b.getActive() ? "Active" : "Inactive"));
        }
    }

    private void addTrashedFlashSales(List<Map<String, Object>> items, String search) {
        List<FlashSale> trashed = search != null && !search.isEmpty()
            ? flashSaleRepository.findByDeletedTrueAndNameContainingIgnoreCase(search)
            : flashSaleRepository.findByDeletedTrue();
        for (FlashSale fs : trashed) {
            items.add(buildItem("flash-sales", fs.getId(), "Flash Sale", fs.getName(), fs.getDeletedAt(), fs.getStatus()));
        }
    }

    private void addTrashedTestimonials(List<Map<String, Object>> items, String search) {
        List<Testimonial> trashed = search != null && !search.isEmpty()
            ? testimonialRepository.findByDeletedTrueAndReviewerNameContainingIgnoreCase(search)
            : testimonialRepository.findByDeletedTrue();
        for (Testimonial t : trashed) {
            items.add(buildItem("testimonials", t.getId(), "Testimonial", t.getReviewerName(), t.getDeletedAt(), t.getActive() ? "Active" : "Inactive"));
        }
    }

    private void addTrashedSizeGuides(List<Map<String, Object>> items, String search) {
        List<SizeGuide> trashed = search != null && !search.isEmpty()
            ? sizeGuideRepository.findByDeletedTrueAndNameContainingIgnoreCase(search)
            : sizeGuideRepository.findByDeletedTrue();
        for (SizeGuide sg : trashed) {
            items.add(buildItem("size-guides", sg.getId(), "Size Guide", sg.getName(), sg.getDeletedAt(), sg.getActive() ? "Active" : "Inactive"));
        }
    }

    private Map<String, Object> buildItem(String type, Long id, String entityType, String name, Long deletedAt, String status) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", id);
        item.put("type", type);
        item.put("entityType", entityType);
        item.put("name", name);
        item.put("deletedAt", deletedAt);
        item.put("status", status);
        return item;
    }

    // ── Empty helpers ──

    private int emptyProducts() {
        List<Product> items = productRepository.findByDeletedTrue();
        productRepository.deleteAll(items);
        return items.size();
    }

    private int emptyVendors() {
        List<Vendor> items = vendorRepository.findByDeletedTrue();
        vendorRepository.deleteAll(items);
        return items.size();
    }

    private int emptyCustomers() {
        List<User> items = userRepository.findByDeletedTrue();
        userRepository.deleteAll(items);
        return items.size();
    }

    private int emptyCategories() {
        List<Category> items = categoryRepository.findByDeletedTrue();
        categoryRepository.deleteAll(items);
        return items.size();
    }

    private int emptyBrands() {
        List<Brand> items = brandRepository.findByDeletedTrue();
        brandRepository.deleteAll(items);
        return items.size();
    }

    private int emptyCoupons() {
        List<Coupon> items = couponRepository.findByDeletedTrue();
        couponRepository.deleteAll(items);
        return items.size();
    }

    private int emptyShippingZones() {
        List<ShippingZone> items = shippingZoneRepository.findByDeletedTrue();
        shippingZoneRepository.deleteAll(items);
        return items.size();
    }

    private int emptyTaxRates() {
        List<TaxRate> items = taxRateRepository.findByDeletedTrue();
        taxRateRepository.deleteAll(items);
        return items.size();
    }

    private int emptyDeliveryPartners() {
        List<DeliveryPartner> items = deliveryPartnerRepository.findByDeletedTrue();
        deliveryPartnerRepository.deleteAll(items);
        return items.size();
    }

    private int emptyBlogPosts() {
        List<BlogPost> items = blogPostRepository.findByDeletedTrue();
        blogPostRepository.deleteAll(items);
        return items.size();
    }

    private int emptyFaqs() {
        List<Faq> items = faqRepository.findByDeletedTrue();
        faqRepository.deleteAll(items);
        return items.size();
    }

    private int emptyBanners() {
        List<Banner> items = bannerRepository.findByDeletedTrue();
        bannerRepository.deleteAll(items);
        return items.size();
    }

    private int emptyFlashSales() {
        List<FlashSale> items = flashSaleRepository.findByDeletedTrue();
        flashSaleRepository.deleteAll(items);
        return items.size();
    }

    private int emptyTestimonials() {
        List<Testimonial> items = testimonialRepository.findByDeletedTrue();
        testimonialRepository.deleteAll(items);
        return items.size();
    }

    private int emptySizeGuides() {
        List<SizeGuide> items = sizeGuideRepository.findByDeletedTrue();
        sizeGuideRepository.deleteAll(items);
        return items.size();
    }
}
