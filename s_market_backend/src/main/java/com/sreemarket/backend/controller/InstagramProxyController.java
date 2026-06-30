package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.ProductMedia;
import com.sreemarket.backend.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/instagram")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://localhost:3000"}, allowCredentials = "true")
public class InstagramProxyController {

    private static final Logger log = LoggerFactory.getLogger(InstagramProxyController.class);

    @Autowired
    private ProductService productService;

    @GetMapping("/thumbnail")
    public ResponseEntity<byte[]> getThumbnail(@RequestParam String shortcode) {
        log.info("Instagram thumbnail requested for shortcode: {}", shortcode);
        
        // Try oEmbed API first (more reliable), fall back to direct media endpoint
        try {
            String oembedUrl = "https://api.instagram.com/oembed?url=https://www.instagram.com/p/" + shortcode + "/";
            log.info("Trying oEmbed: {}", oembedUrl);
            URI oembedUri = new URI(oembedUrl);
            HttpURLConnection oembedConn = (HttpURLConnection) oembedUri.toURL().openConnection();
            oembedConn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            oembedConn.setConnectTimeout(5000);
            oembedConn.setReadTimeout(5000);
            oembedConn.connect();

            if (oembedConn.getResponseCode() == 200) {
                String oembedJson;
                try (InputStream in = oembedConn.getInputStream()) {
                    oembedJson = new String(in.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                }
                // Extract thumbnail_url from JSON
                String thumbKey = "\"thumbnail_url\":\"";
                int idx = oembedJson.indexOf(thumbKey);
                if (idx >= 0) {
                    int start = idx + thumbKey.length();
                    int end = oembedJson.indexOf("\"", start);
                    if (end > start) {
                        String thumbUrl = oembedJson.substring(start, end).replace("\\/", "/");
                        log.info("Found thumbnail via oEmbed: {}", thumbUrl);
                        return fetchImage(thumbUrl);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("oEmbed attempt failed for shortcode: {}, falling back to direct", shortcode);
        }

        // Fallback: direct Instagram media endpoint
        try {
            String url = "https://www.instagram.com/p/" + shortcode + "/media/?size=l";
            log.info("Falling back to: {}", url);
            URI uri = new URI(url);
            HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            conn.setRequestProperty("Accept", "image/avif,image/webp,image/apng,image/*,*/*;q=0.8");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.connect();

            int status = conn.getResponseCode();
            log.info("Direct response status: {}", status);

            if (status >= 300 && status < 400) {
                String redirectUrl = conn.getHeaderField("Location");
                log.info("Redirecting to: {}", redirectUrl);
                if (redirectUrl != null) {
                    return fetchImage(redirectUrl);
                }
            }

            if (status == 200) {
                String contentType = conn.getContentType();
                MediaType mediaType = contentType != null ? MediaType.parseMediaType(contentType) : MediaType.IMAGE_JPEG;

                byte[] imageBytes;
                try (InputStream in = conn.getInputStream()) {
                    imageBytes = in.readAllBytes();
                }
                log.info("Direct image size: {} bytes", imageBytes.length);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(mediaType);
                headers.setCacheControl("public, max-age=86400");

                return ResponseEntity.ok().headers(headers).body(imageBytes);
            }
        } catch (Exception e) {
            log.error("All thumbnail methods failed for shortcode: {}", shortcode, e);
        }

        return ResponseEntity.notFound().build();
    }

    private ResponseEntity<byte[]> fetchImage(String imageUrl) throws Exception {
        log.info("Fetching image from: {}", imageUrl);
        URI uri = new URI(imageUrl);
        HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        conn.setRequestProperty("Accept", "image/avif,image/webp,image/apng,image/*,*/*;q=0.8");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);
        conn.connect();

        if (conn.getResponseCode() >= 300 && conn.getResponseCode() < 400) {
            String redirectUrl = conn.getHeaderField("Location");
            if (redirectUrl != null) {
                return fetchImage(redirectUrl);
            }
        }

        String contentType = conn.getContentType();
        MediaType mediaType = contentType != null ? MediaType.parseMediaType(contentType) : MediaType.IMAGE_JPEG;

        byte[] imageBytes;
        try (InputStream in = conn.getInputStream()) {
            imageBytes = in.readAllBytes();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setCacheControl("public, max-age=86400");

        return ResponseEntity.ok().headers(headers).body(imageBytes);
    }

    @PostMapping("/media/{mediaId}/thumbnail")
    public ResponseEntity<?> uploadCustomThumbnail(@PathVariable Long mediaId, @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is required"));
            }
            ProductMedia media = productService.uploadCustomThumbnail(mediaId, file);
            return ResponseEntity.ok(media);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
