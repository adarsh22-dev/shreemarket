package com.sreemarket.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreemarket.backend.model.AbandonedCart;
import com.sreemarket.backend.model.Cart;
import com.sreemarket.backend.model.CartItem;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.User;
import com.sreemarket.backend.repository.AbandonedCartRepository;
import com.sreemarket.backend.repository.CartRepository;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AbandonedCartService {

    @Autowired
    private AbandonedCartRepository abandonedCartRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private EmailService emailService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.abandoned-cart.threshold-hours:2}")
    private int thresholdHours;

    @Value("${app.abandoned-cart.max-recovery-attempts:3}")
    private int maxRecoveryAttempts;

    @Value("${app.abandoned-cart.recovery-interval-hours:24}")
    private int recoveryIntervalHours;

    @Value("${app.base.url:http://localhost:5173}")
    private String appBaseUrl;

    private static final long HOUR_MS = 60 * 60 * 1000L;

    /**
     * Scheduled task: scan for abandoned carts every 30 minutes
     */
    @Scheduled(fixedRate = 30 * 60 * 1000, initialDelay = 60 * 1000)
    public void detectAbandonedCarts() {
        try {
            long thresholdTime = System.currentTimeMillis() - (thresholdHours * HOUR_MS);
            List<Cart> allCarts = cartRepository.findAll();

            for (Cart cart : allCarts) {
                if (cart.getUserId() == null) continue;
                if (cart.getItems() == null || cart.getItems().isEmpty()) continue;

                // Check if cart was last updated before threshold
                if (cart.getUpdatedAt() != null && cart.getUpdatedAt() < thresholdTime) {
                    // Check if already tracked
                    Optional<AbandonedCart> existing = abandonedCartRepository
                            .findByCartIdAndStatus(cart.getId(), "PENDING");
                    if (existing.isEmpty()) {
                        trackAbandonedCart(cart);
                    }
                }
            }
        } catch (Exception e) {
            // Log but don't throw - scheduled task should not crash
        }
    }

    /**
     * Track a cart as abandoned
     */
    public AbandonedCart trackAbandonedCart(Cart cart) {
        double total = 0;
        int itemCount = 0;
        List<Map<String, Object>> itemSummaries = new ArrayList<>();

        for (CartItem item : cart.getItems()) {
            if (item.getProductId() != null) {
                Optional<Product> productOpt = productRepository.findById(item.getProductId());
                if (productOpt.isPresent()) {
                    Product p = productOpt.get();
                    double price = p.getDiscountPrice() != null ? p.getDiscountPrice() : p.getRegularPrice();
                    total += price * item.getQuantity();
                    itemCount += item.getQuantity();

                    Map<String, Object> summary = new HashMap<>();
                    summary.put("productName", p.getName());
                    summary.put("quantity", item.getQuantity());
                    summary.put("price", price);
                    summary.put("image", p.getMedia() != null && !p.getMedia().isEmpty()
                            ? p.getMedia().get(0).getFileName() : null);
                    itemSummaries.add(summary);
                }
            }
        }

        AbandonedCart abandoned = new AbandonedCart();
        abandoned.setUserId(cart.getUserId());
        abandoned.setCartId(cart.getId());
        abandoned.setAbandonedAt(cart.getUpdatedAt());
        abandoned.setCartTotal(total);
        abandoned.setItemCount(itemCount);
        try {
            abandoned.setCartSummary(objectMapper.writeValueAsString(itemSummaries));
        } catch (Exception e) {
            abandoned.setCartSummary("[]");
        }
        abandoned.setStatus("PENDING");
        abandoned.setRecoveryAttempts(0);
        abandoned.setEmailOpened(false);
        abandoned.setLinkClicked(false);

        return abandonedCartRepository.save(abandoned);
    }

    /**
     * Send recovery email for a specific abandoned cart
     */
    public AbandonedCart sendRecoveryEmail(Long abandonedCartId) {
        AbandonedCart abandoned = abandonedCartRepository.findById(abandonedCartId)
                .orElseThrow(() -> new RuntimeException("Abandoned cart not found"));

        if ("RECOVERED".equals(abandoned.getStatus()) || "EXPIRED".equals(abandoned.getStatus())) {
            throw new RuntimeException("Cart is already " + abandoned.getStatus());
        }

        if (abandoned.getRecoveryAttempts() >= maxRecoveryAttempts) {
            abandoned.setStatus("EXPIRED");
            return abandonedCartRepository.save(abandoned);
        }

        User user = userRepository.findById(abandoned.getUserId()).orElse(null);
        if (user == null || user.getEmail() == null) {
            throw new RuntimeException("User not found or no email");
        }

        // Build cart items HTML
        String itemsHtml = buildCartItemsHtml(abandoned.getCartSummary());
        String cartUrl = appBaseUrl + "/cart";

        emailService.sendAbandonedCartRecoveryEmail(
                user.getEmail(),
                user.getFullName() != null ? user.getFullName() : user.getEmail(),
                abandoned.getCartTotal(),
                abandoned.getItemCount(),
                itemsHtml,
                cartUrl
        );

        abandoned.setRecoveryAttempts(abandoned.getRecoveryAttempts() + 1);
        abandoned.setLastAttemptAt(System.currentTimeMillis());
        abandoned.setRecoveryMethod("EMAIL");
        abandoned.setEmailSentTo(user.getEmail());

        return abandonedCartRepository.save(abandoned);
    }

    /**
     * Send recovery emails for all pending abandoned carts that are due
     */
    public Map<String, Object> sendBulkRecoveryEmails() {
        List<AbandonedCart> pending = abandonedCartRepository.findByStatus("PENDING");
        long dueTime = System.currentTimeMillis() - (recoveryIntervalHours * HOUR_MS);

        int sent = 0;
        int skipped = 0;
        int failed = 0;

        for (AbandonedCart cart : pending) {
            if (cart.getRecoveryAttempts() >= maxRecoveryAttempts) {
                cart.setStatus("EXPIRED");
                abandonedCartRepository.save(cart);
                continue;
            }

            boolean isDue = cart.getLastAttemptAt() == null || cart.getLastAttemptAt() < dueTime;
            if (!isDue) {
                skipped++;
                continue;
            }

            try {
                sendRecoveryEmail(cart.getId());
                sent++;
            } catch (Exception e) {
                failed++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("sent", sent);
        result.put("skipped", skipped);
        result.put("failed", failed);
        result.put("total", pending.size());
        return result;
    }

    /**
     * Mark a cart as recovered (user completed checkout)
     */
    public void markRecovered(Long cartId) {
        Optional<AbandonedCart> abandoned = abandonedCartRepository.findByCartIdAndStatus(cartId, "PENDING");
        if (abandoned.isPresent()) {
            AbandonedCart ac = abandoned.get();
            ac.setStatus("RECOVERED");
            ac.setRecoveredAt(System.currentTimeMillis());
            abandonedCartRepository.save(ac);
        }
    }

    /**
     * Dismiss an abandoned cart record
     */
    public AbandonedCart dismiss(Long id) {
        AbandonedCart abandoned = abandonedCartRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Abandoned cart not found"));
        abandoned.setStatus("DISMISSED");
        return abandonedCartRepository.save(abandoned);
    }

    /**
     * Get all abandoned carts with filtering
     */
    public List<AbandonedCart> getAll() {
        return abandonedCartRepository.findAll();
    }

    public List<AbandonedCart> getByStatus(String status) {
        return abandonedCartRepository.findByStatus(status);
    }

    public AbandonedCart getById(Long id) {
        return abandonedCartRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Abandoned cart not found"));
    }

    /**
     * Get abandonment statistics
     */
    public Map<String, Object> getStats() {
        long total = abandonedCartRepository.count();
        long pending = abandonedCartRepository.countByStatus("PENDING");
        long recovered = abandonedCartRepository.countByStatus("RECOVERED");
        long expired = abandonedCartRepository.countByStatus("EXPIRED");
        long dismissed = abandonedCartRepository.countByStatus("DISMISSED");

        List<AbandonedCart> allRecovered = abandonedCartRepository.findByStatus("RECOVERED");
        double totalRecoveredValue = allRecovered.stream()
                .mapToDouble(a -> a.getCartTotal() != null ? a.getCartTotal() : 0)
                .sum();

        double recoveryRate = total > 0 ? (double) recovered / total * 100 : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("recovered", recovered);
        stats.put("expired", expired);
        stats.put("dismissed", dismissed);
        stats.put("recoveryRate", Math.round(recoveryRate * 10.0) / 10.0);
        stats.put("totalRecoveredValue", totalRecoveredValue);
        stats.put("thresholdHours", thresholdHours);
        stats.put("maxRecoveryAttempts", maxRecoveryAttempts);
        stats.put("recoveryIntervalHours", recoveryIntervalHours);
        return stats;
    }

    /**
     * Update settings
     */
    public Map<String, Object> updateSettings(Map<String, Object> settings) {
        // Settings are read from application.properties, but we can return current values
        Map<String, Object> current = getStats();
        current.put("message", "Settings are managed via application.properties. Restart required for changes.");
        return current;
    }

    private String buildCartItemsHtml(String cartSummaryJson) {
        if (cartSummaryJson == null || cartSummaryJson.isEmpty()) return "";

        try {
            List<Map<String, Object>> items = objectMapper.readValue(cartSummaryJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

            StringBuilder html = new StringBuilder();
            html.append("<table style='width:100%;border-collapse:collapse;margin:16px 0;'>");
            html.append("<tr style='background:#f8f9fa;'>");
            html.append("<th style='padding:10px;text-align:left;border-bottom:2px solid #dee2e6;'>Product</th>");
            html.append("<th style='padding:10px;text-align:center;border-bottom:2px solid #dee2e6;'>Qty</th>");
            html.append("<th style='padding:10px;text-align:right;border-bottom:2px solid #dee2e6;'>Price</th>");
            html.append("</tr>");

            for (Map<String, Object> item : items) {
                String name = (String) item.getOrDefault("productName", "Product");
                int qty = item.get("quantity") != null ? ((Number) item.get("quantity")).intValue() : 1;
                double price = item.get("price") != null ? ((Number) item.get("price")).doubleValue() : 0;

                html.append("<tr>");
                html.append("<td style='padding:10px;border-bottom:1px solid #eee;'>").append(name).append("</td>");
                html.append("<td style='padding:10px;text-align:center;border-bottom:1px solid #eee;'>").append(qty).append("</td>");
                html.append("<td style='padding:10px;text-align:right;border-bottom:1px solid #eee;'>₹").append(String.format("%.2f", price)).append("</td>");
                html.append("</tr>");
            }

            html.append("</table>");
            return html.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
