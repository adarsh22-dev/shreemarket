package com.sreemarket.backend.service;

import com.sreemarket.backend.model.*;
import com.sreemarket.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminCmsService {

    @Autowired private BlogPostRepository blogPostRepository;
    @Autowired private CmsPageRepository cmsPageRepository;
    @Autowired private FaqRepository faqRepository;
    @Autowired private CouponRepository couponRepository;
    @Autowired private FlashSaleRepository flashSaleRepository;
    @Autowired private BannerRepository bannerRepository;
    @Autowired private PushNotificationRepository pushNotificationRepository;
    @Autowired private NewsletterCampaignRepository newsletterCampaignRepository;
    @Autowired private SubscriberListRepository subscriberListRepository;
    @Autowired private ReferrerRepository referrerRepository;
    @Autowired private LoyaltyCustomerRepository loyaltyCustomerRepository;
    @Autowired private RefundRepository refundRepository;
    @Autowired private VendorShipmentRepository vendorShipmentRepository;
    @Autowired private HelpArticleRepository helpArticleRepository;
    @Autowired private SeoPageRepository seoPageRepository;
    @Autowired private CustomSnippetRepository customSnippetRepository;
    @Autowired private UrlRedirectRepository urlRedirectRepository;

    // Blog Posts
    public List<BlogPost> getAllBlogPosts() { return blogPostRepository.findAll(); }
    public BlogPost saveBlogPost(BlogPost p) { return blogPostRepository.save(p); }
    public BlogPost updateBlogPost(Long id, BlogPost p) {
        BlogPost existing = blogPostRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        existing.setTitle(p.getTitle()); existing.setCategory(p.getCategory()); existing.setAuthor(p.getAuthor());
        existing.setStatus(p.getStatus()); existing.setTags(p.getTags()); existing.setViews(p.getViews());
        existing.setComments(p.getComments()); existing.setReadMin(p.getReadMin()); existing.setDate(p.getDate());
        existing.setSlug(p.getSlug()); existing.setMetaTitle(p.getMetaTitle()); existing.setMetaDesc(p.getMetaDesc());
        return blogPostRepository.save(existing);
    }
    public void deleteBlogPost(Long id) { blogPostRepository.deleteById(id); }

    // CMS Pages
    public List<CmsPage> getAllCmsPages() { return cmsPageRepository.findAll(); }
    public CmsPage saveCmsPage(CmsPage p) { return cmsPageRepository.save(p); }
    public CmsPage updateCmsPage(Long id, CmsPage p) {
        CmsPage e = cmsPageRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        e.setTitle(p.getTitle()); e.setSlug(p.getSlug()); e.setStatus(p.getStatus());
        e.setVisibility(p.getVisibility()); e.setTemplate(p.getTemplate()); e.setAuthor(p.getAuthor());
        e.setUpdatedAt(p.getUpdatedAt()); e.setMetaTitle(p.getMetaTitle()); e.setMetaDesc(p.getMetaDesc());
        return cmsPageRepository.save(e);
    }
    public void deleteCmsPage(Long id) { cmsPageRepository.deleteById(id); }

    // FAQs
    public List<Faq> getAllFaqs() { return faqRepository.findAll(); }
    public Faq saveFaq(Faq f) { return faqRepository.save(f); }
    public Faq updateFaq(Long id, Faq f) {
        Faq e = faqRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        e.setQuestion(f.getQuestion()); e.setCategory(f.getCategory()); e.setAnswer(f.getAnswer());
        e.setStatus(f.getStatus()); e.setSortOrder(f.getSortOrder()); e.setViews(f.getViews());
        return faqRepository.save(e);
    }
    public void deleteFaq(Long id) { faqRepository.deleteById(id); }

    // Coupons
    public List<Coupon> getAllCoupons() { return couponRepository.findAll(); }
    public Coupon saveCoupon(Coupon c) { return couponRepository.save(c); }
    public Coupon updateCoupon(Long id, Coupon c) {
        Coupon e = couponRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        e.setCode(c.getCode()); e.setType(c.getType()); e.setValue(c.getValue()); e.setMinOrder(c.getMinOrder());
        e.setMaxDisc(c.getMaxDisc()); e.setUses(c.getUses()); e.setMaxUses(c.getMaxUses()); e.setExpiry(c.getExpiry());
        e.setCategories(c.getCategories()); e.setStatus(c.getStatus()); e.setRevenue(c.getRevenue()); e.setOrders(c.getOrders());
        return couponRepository.save(e);
    }
    public void deleteCoupon(Long id) { couponRepository.deleteById(id); }

    // Flash Sales
    public List<FlashSale> getAllFlashSales() { return flashSaleRepository.findAll(); }
    public FlashSale saveFlashSale(FlashSale f) { return flashSaleRepository.save(f); }
    public void deleteFlashSale(Long id) { flashSaleRepository.deleteById(id); }

    // Banners
    public List<Banner> getAllBanners() { return bannerRepository.findAll(); }
    public Banner saveBanner(Banner b) { return bannerRepository.save(b); }
    public void deleteBanner(Long id) { bannerRepository.deleteById(id); }

    // Push Notifications
    public List<PushNotification> getAllPushNotifications() { return pushNotificationRepository.findAll(); }
    public PushNotification savePushNotification(PushNotification p) { return pushNotificationRepository.save(p); }
    public PushNotification updatePushNotification(Long id, PushNotification p) {
        PushNotification e = pushNotificationRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        e.setTitle(p.getTitle()); e.setBody(p.getBody()); e.setSegment(p.getSegment());
        e.setScheduled(p.getScheduled()); e.setSent(p.getSent());
        e.setDelivered(p.getDelivered()); e.setOpened(p.getOpened()); e.setCtr(p.getCtr());
        e.setStatus(p.getStatus());
        return pushNotificationRepository.save(e);
    }
    public void deletePushNotification(Long id) { pushNotificationRepository.deleteById(id); }

    // Newsletter Campaigns
    public List<NewsletterCampaign> getAllNewsletterCampaigns() { return newsletterCampaignRepository.findAll(); }
    public NewsletterCampaign saveNewsletterCampaign(NewsletterCampaign c) { return newsletterCampaignRepository.save(c); }
    public void deleteNewsletterCampaign(Long id) { newsletterCampaignRepository.deleteById(id); }

    // Subscriber Lists
    public List<SubscriberList> getAllSubscriberLists() { return subscriberListRepository.findAll(); }
    public SubscriberList saveSubscriberList(SubscriberList s) { return subscriberListRepository.save(s); }
    public void deleteSubscriberList(Long id) { subscriberListRepository.deleteById(id); }

    // Referrers
    public List<Referrer> getAllReferrers() { return referrerRepository.findAll(); }
    public Referrer saveReferrer(Referrer r) { return referrerRepository.save(r); }
    public void deleteReferrer(Long id) { referrerRepository.deleteById(id); }

    // Loyalty Customers
    public List<LoyaltyCustomer> getAllLoyaltyCustomers() { return loyaltyCustomerRepository.findAll(); }
    public LoyaltyCustomer saveLoyaltyCustomer(LoyaltyCustomer l) { return loyaltyCustomerRepository.save(l); }

    // Refunds
    public List<Refund> getAllRefunds() { return refundRepository.findAll(); }
    public Refund getRefundById(Long id) { return refundRepository.findById(id).orElse(null); }
    public Refund saveRefund(Refund r) { return refundRepository.save(r); }
    public void deleteRefund(Long id) { refundRepository.deleteById(id); }

    // Vendor Shipments
    public List<VendorShipment> getAllVendorShipments() { return vendorShipmentRepository.findAll(); }
    public VendorShipment saveVendorShipment(VendorShipment s) { return vendorShipmentRepository.save(s); }

    // Help Articles
    public List<HelpArticle> getAllHelpArticles() { return helpArticleRepository.findAll(); }
    public HelpArticle saveHelpArticle(HelpArticle a) { return helpArticleRepository.save(a); }

    // SEO Pages
    public List<SeoPage> getAllSeoPages() { return seoPageRepository.findAll(); }
    public SeoPage saveSeoPage(SeoPage p) { return seoPageRepository.save(p); }
    public SeoPage updateSeoPage(Long id, SeoPage p) {
        SeoPage e = seoPageRepository.findById(id).orElseThrow(() -> new RuntimeException("SEO page not found"));
        e.setPage(p.getPage()); e.setUrl(p.getUrl()); e.setTitle(p.getTitle());
        e.setDescription(p.getDescription()); e.setStatus(p.getStatus());
        return seoPageRepository.save(e);
    }
    public void deleteSeoPage(Long id) { seoPageRepository.deleteById(id); }

    // Custom Snippets
    public List<CustomSnippet> getAllCustomSnippets() { return customSnippetRepository.findAll(); }
    public CustomSnippet saveCustomSnippet(CustomSnippet s) { return customSnippetRepository.save(s); }
    public CustomSnippet updateCustomSnippet(Long id, CustomSnippet s) {
        CustomSnippet e = customSnippetRepository.findById(id).orElseThrow(() -> new RuntimeException("Snippet not found"));
        e.setLabel(s.getLabel()); e.setLocation(s.getLocation()); e.setSlot(s.getSlot());
        e.setCode(s.getCode()); e.setNotes(s.getNotes()); e.setActive(s.getActive());
        e.setUpdatedAt(s.getUpdatedAt());
        return customSnippetRepository.save(e);
    }
    public void deleteCustomSnippet(Long id) { customSnippetRepository.deleteById(id); }

    // URL Redirects
    public List<UrlRedirect> getAllUrlRedirects() { return urlRedirectRepository.findAll(); }
    public UrlRedirect saveUrlRedirect(UrlRedirect r) { return urlRedirectRepository.save(r); }
    public UrlRedirect updateUrlRedirect(Long id, UrlRedirect r) {
        UrlRedirect e = urlRedirectRepository.findById(id).orElseThrow(() -> new RuntimeException("Redirect not found"));
        e.setFromPath(r.getFromPath()); e.setToPath(r.getToPath()); e.setType(r.getType());
        e.setActive(r.getActive()); e.setHits(r.getHits()); e.setNote(r.getNote());
        return urlRedirectRepository.save(e);
    }
    public void deleteUrlRedirect(Long id) { urlRedirectRepository.deleteById(id); }
}
