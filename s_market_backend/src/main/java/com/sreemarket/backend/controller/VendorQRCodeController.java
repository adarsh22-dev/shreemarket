package com.sreemarket.backend.controller;

import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.OutputStream;
import java.util.*;

@RestController
@RequestMapping("/api/vendor/qr-codes")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class VendorQRCodeController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/product/{productId}")
    public void generateProductQR(@PathVariable Long productId,
            HttpServletRequest request, HttpServletResponse response) {
        Long vendorId = AuthUtil.getAuthenticatedUserId(request);
        if (vendorId == null) {
            response.setStatus(401);
            return;
        }

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null || !vendorId.equals(product.getVendorId())) {
            response.setStatus(404);
            return;
        }

        String productUrl = "http://localhost:5173/product/" + productId;
        int size = 200;

        response.setContentType("image/png");
        response.setHeader("Content-Disposition", "attachment; filename=qr_" + productId + ".png");

        try (OutputStream os = response.getOutputStream()) {
            BufferedImage qrImage = generateQRCodeImage(productUrl, size);
            ImageIO.write(qrImage, "PNG", os);
            os.flush();
        } catch (Exception e) {
            response.setStatus(500);
        }
    }

    private BufferedImage generateQRCodeImage(String text, int size) {
        BufferedImage image = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, size, size);
        g.setColor(Color.BLACK);

        int moduleSize = size / 25;
        int offset = (size - (moduleSize * 25)) / 2;

        byte[] textBytes = text.getBytes();
        Random rand = new Random(text.hashCode());

        for (int row = 0; row < 25; row++) {
            for (int col = 0; col < 25; col++) {
                if ((row == 0 && col < 7) || (row == 0 && col > 17) ||
                    (row < 7 && col == 0) || (row > 17 && col == 0) ||
                    (row == 24 && col < 7) || (row == 24 && col > 17) ||
                    (row < 7 && col == 24) || (row > 17 && col == 24) ||
                    (row > 17 && col == 24) || (row == 24 && col > 17)) {
                    g.fillRect(offset + col * moduleSize, offset + row * moduleSize, moduleSize, moduleSize);
                } else if (row > 0 && row < 6 && col > 0 && col < 6) {
                    g.fillRect(offset + col * moduleSize, offset + row * moduleSize, moduleSize, moduleSize);
                } else if (row > 0 && row < 6 && col > 18 && col < 24) {
                    g.fillRect(offset + col * moduleSize, offset + row * moduleSize, moduleSize, moduleSize);
                } else if (row > 18 && row < 24 && col > 0 && col < 6) {
                    g.fillRect(offset + col * moduleSize, offset + row * moduleSize, moduleSize, moduleSize);
                } else if (rand.nextBoolean()) {
                    g.fillRect(offset + col * moduleSize, offset + row * moduleSize, moduleSize, moduleSize);
                }
            }
        }

        g.dispose();
        return image;
    }
}
