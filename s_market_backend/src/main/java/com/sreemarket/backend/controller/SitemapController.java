package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Category;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.SeoPage;
import com.sreemarket.backend.repository.CategoryRepository;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.repository.SeoPageRepository;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SitemapController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SeoPageRepository seoPageRepository;

    public SitemapController(ProductRepository productRepository,
                             CategoryRepository categoryRepository,
                             SeoPageRepository seoPageRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.seoPageRepository = seoPageRepository;
    }

    @GetMapping("/sitemap.xml")
    public ResponseEntity<String> getSitemap() {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        String baseUrl = "https://sreemarket.com";

        // Static pages
        String[] staticPages = {"/", "/shop", "/about", "/contact", "/login", "/register", "/cart", "/wholesale"};
        for (String page : staticPages) {
            xml.append("  <url>\n");
            xml.append("    <loc>").append(baseUrl).append(page).append("</loc>\n");
            xml.append("    <changefreq>weekly</changefreq>\n");
            xml.append("    <priority>0.8</priority>\n");
            xml.append("  </url>\n");
        }

        // Products
        List<Product> products = productRepository.findAll();
        for (Product p : products) {
            if ("ACTIVE".equals(p.getStatus())) {
                xml.append("  <url>\n");
                xml.append("    <loc>").append(baseUrl).append("/product/").append(p.getId()).append("</loc>\n");
                xml.append("    <changefreq>daily</changefreq>\n");
                xml.append("    <priority>0.6</priority>\n");
                xml.append("  </url>\n");
            }
        }

        // Categories
        List<Category> categories = categoryRepository.findAll();
        for (Category c : categories) {
            xml.append("  <url>\n");
            xml.append("    <loc>").append(baseUrl).append("/category/").append(c.getId()).append("</loc>\n");
            xml.append("    <changefreq>weekly</changefreq>\n");
            xml.append("    <priority>0.7</priority>\n");
            xml.append("  </url>\n");
        }

        // SEO pages
        List<SeoPage> seoPages = seoPageRepository.findAll();
        for (SeoPage s : seoPages) {
            xml.append("  <url>\n");
            xml.append("    <loc>").append(baseUrl).append(s.getUrl()).append("</loc>\n");
            xml.append("    <changefreq>monthly</changefreq>\n");
            xml.append("    <priority>0.5</priority>\n");
            xml.append("  </url>\n");
        }

        xml.append("</urlset>");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_XML).body(xml.toString());
    }

    @GetMapping("/robots.txt")
    public ResponseEntity<String> getRobots() {
        String robots = "User-agent: *\n"
                + "Allow: /\n"
                + "Disallow: /admin/\n"
                + "Disallow: /vendor/\n"
                + "Disallow: /api/admin/\n"
                + "Disallow: /api/internal/\n"
                + "Sitemap: https://sreemarket.com/api/sitemap.xml\n";
        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(robots);
    }
}
