package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.*;
import com.sreemarket.backend.service.AdminCmsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/cms")
public class AdminCmsController {

    @Autowired private AdminCmsService cmsService;

    // Blog Posts
    @GetMapping("/blog-posts") public List<BlogPost> getBlogPosts() { return cmsService.getAllBlogPosts(); }
    @PostMapping("/blog-posts") public BlogPost createBlogPost(@RequestBody BlogPost p) { return cmsService.saveBlogPost(p); }
    @PutMapping("/blog-posts/{id}") public BlogPost updateBlogPost(@PathVariable Long id, @RequestBody BlogPost p) { return cmsService.updateBlogPost(id, p); }
    @DeleteMapping("/blog-posts/{id}") public ResponseEntity<?> deleteBlogPost(@PathVariable Long id) { cmsService.deleteBlogPost(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // CMS Pages
    @GetMapping("/pages") public List<CmsPage> getPages() { return cmsService.getAllCmsPages(); }
    @PostMapping("/pages") public CmsPage createPage(@RequestBody CmsPage p) { return cmsService.saveCmsPage(p); }
    @PutMapping("/pages/{id}") public CmsPage updatePage(@PathVariable Long id, @RequestBody CmsPage p) { return cmsService.updateCmsPage(id, p); }
    @DeleteMapping("/pages/{id}") public ResponseEntity<?> deletePage(@PathVariable Long id) { cmsService.deleteCmsPage(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // FAQs
    @GetMapping("/faqs") public List<Faq> getFaqs() { return cmsService.getAllFaqs(); }
    @PostMapping("/faqs") public Faq createFaq(@RequestBody Faq f) { return cmsService.saveFaq(f); }
    @PutMapping("/faqs/{id}") public Faq updateFaq(@PathVariable Long id, @RequestBody Faq f) { return cmsService.updateFaq(id, f); }
    @DeleteMapping("/faqs/{id}") public ResponseEntity<?> deleteFaq(@PathVariable Long id) { cmsService.deleteFaq(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // Coupons
    @GetMapping("/coupons") public List<Coupon> getCoupons() { return cmsService.getAllCoupons(); }
    @PostMapping("/coupons") public Coupon createCoupon(@RequestBody Coupon c) { return cmsService.saveCoupon(c); }
    @PutMapping("/coupons/{id}") public Coupon updateCoupon(@PathVariable Long id, @RequestBody Coupon c) { return cmsService.updateCoupon(id, c); }
    @DeleteMapping("/coupons/{id}") public ResponseEntity<?> deleteCoupon(@PathVariable Long id) { cmsService.deleteCoupon(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // Flash Sales
    @GetMapping("/flash-sales") public List<FlashSale> getFlashSales() { return cmsService.getAllFlashSales(); }
    @PostMapping("/flash-sales") public FlashSale createFlashSale(@RequestBody FlashSale f) { return cmsService.saveFlashSale(f); }
    @PutMapping("/flash-sales/{id}") public FlashSale updateFlashSale(@PathVariable Long id, @RequestBody FlashSale f) { f.setId(id); return cmsService.saveFlashSale(f); }
    @DeleteMapping("/flash-sales/{id}") public ResponseEntity<?> deleteFlashSale(@PathVariable Long id) { cmsService.deleteFlashSale(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // Banners
    @GetMapping("/banners") public List<Banner> getBanners() { return cmsService.getAllBanners(); }
    @PostMapping("/banners") public Banner createBanner(@RequestBody Banner b) { return cmsService.saveBanner(b); }
    @DeleteMapping("/banners/{id}") public ResponseEntity<?> deleteBanner(@PathVariable Long id) { cmsService.deleteBanner(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // Push Notifications
    @GetMapping("/push-notifications") public List<PushNotification> getPushNotifications() { return cmsService.getAllPushNotifications(); }
    @PostMapping("/push-notifications") public PushNotification createPushNotification(@RequestBody PushNotification p) { return cmsService.savePushNotification(p); }
    @PutMapping("/push-notifications/{id}") public PushNotification updatePushNotification(@PathVariable Long id, @RequestBody PushNotification p) { return cmsService.updatePushNotification(id, p); }
    @DeleteMapping("/push-notifications/{id}") public ResponseEntity<?> deletePushNotification(@PathVariable Long id) { cmsService.deletePushNotification(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // Newsletter Campaigns
    @GetMapping("/newsletter-campaigns") public List<NewsletterCampaign> getNewsletterCampaigns() { return cmsService.getAllNewsletterCampaigns(); }
    @PostMapping("/newsletter-campaigns") public NewsletterCampaign createNewsletterCampaign(@RequestBody NewsletterCampaign c) { return cmsService.saveNewsletterCampaign(c); }
    @DeleteMapping("/newsletter-campaigns/{id}") public ResponseEntity<?> deleteNewsletterCampaign(@PathVariable Long id) { cmsService.deleteNewsletterCampaign(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // Subscriber Lists
    @GetMapping("/subscriber-lists") public List<SubscriberList> getSubscriberLists() { return cmsService.getAllSubscriberLists(); }
    @PostMapping("/subscriber-lists") public SubscriberList createSubscriberList(@RequestBody SubscriberList s) { return cmsService.saveSubscriberList(s); }
    @DeleteMapping("/subscriber-lists/{id}") public ResponseEntity<?> deleteSubscriberList(@PathVariable Long id) { cmsService.deleteSubscriberList(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // Referrers
    @GetMapping("/referrers") public List<Referrer> getReferrers() { return cmsService.getAllReferrers(); }
    @PostMapping("/referrers") public Referrer createReferrer(@RequestBody Referrer r) { return cmsService.saveReferrer(r); }
    @DeleteMapping("/referrers/{id}") public ResponseEntity<?> deleteReferrer(@PathVariable Long id) { cmsService.deleteReferrer(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // Loyalty Customers
    @GetMapping("/loyalty-customers") public List<LoyaltyCustomer> getLoyaltyCustomers() { return cmsService.getAllLoyaltyCustomers(); }
    @PostMapping("/loyalty-customers") public LoyaltyCustomer createLoyaltyCustomer(@RequestBody LoyaltyCustomer l) { return cmsService.saveLoyaltyCustomer(l); }

    // Refunds
    @GetMapping("/refunds") public List<Refund> getRefunds() { return cmsService.getAllRefunds(); }
    @PostMapping("/refunds") public Refund createRefund(@RequestBody Refund r) { return cmsService.saveRefund(r); }
    @DeleteMapping("/refunds/{id}") public ResponseEntity<?> deleteRefund(@PathVariable Long id) { cmsService.deleteRefund(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // Vendor Shipments (for vendor dashboard)
    @GetMapping("/vendor-shipments") public List<VendorShipment> getVendorShipments() { return cmsService.getAllVendorShipments(); }
    @PostMapping("/vendor-shipments") public VendorShipment createVendorShipment(@RequestBody VendorShipment s) { return cmsService.saveVendorShipment(s); }

    // Help Articles
    @GetMapping("/help-articles") public List<HelpArticle> getHelpArticles() { return cmsService.getAllHelpArticles(); }
    @PostMapping("/help-articles") public HelpArticle createHelpArticle(@RequestBody HelpArticle a) { return cmsService.saveHelpArticle(a); }

    // SEO Pages
    @GetMapping("/seo-pages") public List<SeoPage> getSeoPages() { return cmsService.getAllSeoPages(); }
    @PostMapping("/seo-pages") public SeoPage createSeoPage(@RequestBody SeoPage p) { return cmsService.saveSeoPage(p); }
    @PutMapping("/seo-pages/{id}") public SeoPage updateSeoPage(@PathVariable Long id, @RequestBody SeoPage p) { return cmsService.updateSeoPage(id, p); }
    @DeleteMapping("/seo-pages/{id}") public ResponseEntity<?> deleteSeoPage(@PathVariable Long id) { cmsService.deleteSeoPage(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // Custom Snippets
    @GetMapping("/custom-snippets") public List<CustomSnippet> getCustomSnippets() { return cmsService.getAllCustomSnippets(); }
    @PostMapping("/custom-snippets") public CustomSnippet createCustomSnippet(@RequestBody CustomSnippet s) { return cmsService.saveCustomSnippet(s); }
    @PutMapping("/custom-snippets/{id}") public CustomSnippet updateCustomSnippet(@PathVariable Long id, @RequestBody CustomSnippet s) { return cmsService.updateCustomSnippet(id, s); }
    @DeleteMapping("/custom-snippets/{id}") public ResponseEntity<?> deleteCustomSnippet(@PathVariable Long id) { cmsService.deleteCustomSnippet(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }

    // URL Redirects
    @GetMapping("/url-redirects") public List<UrlRedirect> getUrlRedirects() { return cmsService.getAllUrlRedirects(); }
    @PostMapping("/url-redirects") public UrlRedirect createUrlRedirect(@RequestBody UrlRedirect r) { return cmsService.saveUrlRedirect(r); }
    @PutMapping("/url-redirects/{id}") public UrlRedirect updateUrlRedirect(@PathVariable Long id, @RequestBody UrlRedirect r) { return cmsService.updateUrlRedirect(id, r); }
    @DeleteMapping("/url-redirects/{id}") public ResponseEntity<?> deleteUrlRedirect(@PathVariable Long id) { cmsService.deleteUrlRedirect(id); return ResponseEntity.ok(Map.of("message", "Deleted")); }
}
