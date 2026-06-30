package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.repository.OrderRepository;
import com.sreemarket.backend.repository.WholesalerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;
import com.sreemarket.backend.repository.ProductRepository;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import com.sreemarket.backend.model.Notification;
import com.sreemarket.backend.model.TaxRate;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.User;
import com.sreemarket.backend.model.LoyaltyCustomer;
import com.sreemarket.backend.model.LoyaltyTransaction;
import com.sreemarket.backend.repository.LoyaltyCustomerRepository;
import com.sreemarket.backend.repository.LoyaltyTransactionRepository;
import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;

@Service
public class OrderService {

        @Autowired
        private OrderRepository orderRepository;

        @Value("${file.upload-dir:uploads}")
        private String uploadDir;

        @Autowired
        private ProductRepository productRepository;

        @Autowired
        private NotificationService notificationService;

        @Autowired
        private TaxRateService taxRateService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserService userService;

    @Autowired
    private LoyaltyCustomerRepository loyaltyCustomerRepository;

    @Autowired
    private LoyaltyTransactionRepository loyaltyTransactionRepository;

    @Autowired
    private StockMovementService stockMovementService;

    @Autowired
    private WholesalerRepository wholesalerRepository;

        public List<Order> getUserOrders(Long userId) {
                return orderRepository.findByUserIdOrderByDatePlacedDesc(userId);
        }

        @Transactional
        public Order createOrder(Order order) {
                if (order.getUserId() == null) {
                        // Guest checkout — automatically create a guest user account
                        User guestUser = new User();
                        String guestEmail = "guest_" + UUID.randomUUID().toString().substring(0, 8).toLowerCase() + "@guest.sreemarket.com";
                        guestUser.setEmail(guestEmail);
                        guestUser.setFullName(order.getCustomerName() != null ? order.getCustomerName() : "Guest");
                        guestUser.setPassword(UUID.randomUUID().toString()); // random password, not usable for login
                        guestUser.setRoleId(2L);
                        guestUser.setStatus("Guest");
                        try {
                            guestUser = userService.registerUser(guestUser);
                            order.setUserId(guestUser.getId());
                        } catch (Exception e) {
                            // Fallback: still allow order creation without user
                            System.err.println("Failed to create guest user: " + e.getMessage());
                        }
                }
                if (order.getUserId() != null) {
                    wholesalerRepository.findById(order.getUserId()).ifPresent(w -> {
                        if (w.getRoleId() != null && w.getRoleId() == 4L) {
                            order.setWholesalerId(order.getUserId());
                        }
                    });
                }
                if (order.getProductQuantities() == null || order.getProductQuantities().isEmpty()) {
                        throw new IllegalArgumentException("productQuantities is required");
                }
                order.setDatePlaced(Instant.now().toEpochMilli());

                // Per-product tax calculation (like Amazon/Flipkart — HSN-based)
                double totalTax = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0, totalCess = 0, totalTcs = 0;
                double appliedRate = 18.0;

                if (order.getProductQuantities() != null && !order.getProductQuantities().isEmpty()) {
                    List<TaxRate> activeTaxes = taxRateService.getActive();

                    for (Map.Entry<Long, Integer> entry : order.getProductQuantities().entrySet()) {
                        Long productId = entry.getKey();
                        Integer quantity = entry.getValue();
                        if (quantity == null || quantity <= 0) continue;

                        Product product = productRepository.findById(productId).orElse(null);
                        if (product == null) continue;

                        double price = product.getDiscountPrice() != null ? product.getDiscountPrice()
                                    : (product.getRegularPrice() != null ? product.getRegularPrice() : 0);
                        double lineTotal = price * quantity;

                        String hsn = product.getHsnCode();
                        TaxRate matchedRate = null;
                        if (hsn != null && !hsn.isEmpty()) {
                            matchedRate = activeTaxes.stream()
                                .filter(t -> t.getHsnCode() != null && hsn.startsWith(t.getHsnCode()))
                                .findFirst().orElse(null);
                        }
                        if (matchedRate == null) {
                            matchedRate = activeTaxes.stream()
                                .filter(t -> Boolean.TRUE.equals(t.getIsDefault()))
                                .findFirst().orElse(activeTaxes.isEmpty() ? null : activeTaxes.get(0));
                        }

                        if (matchedRate != null) {
                            appliedRate = matchedRate.getRate();
                            double ratePct = matchedRate.getRate() / 100.0;
                            double itemTax = lineTotal * ratePct;
                            totalTax += itemTax;

                            double cgst = matchedRate.getCgst() != null ? matchedRate.getCgst() / 100.0 * lineTotal : 0;
                            double sgst = matchedRate.getSgst() != null ? matchedRate.getSgst() / 100.0 * lineTotal : 0;
                            totalCgst += cgst;
                            totalSgst += sgst;

                            double tcsRate = matchedRate.getTcsRate() != null ? matchedRate.getTcsRate() / 100.0 : 0.01;
                            totalTcs += lineTotal * tcsRate;
                        }
                    }
                } else if (order.getTotalAmount() != null) {
                    // Fallback: apply default tax on total
                    List<TaxRate> activeTaxes = taxRateService.getActive();
                    TaxRate defaultTax = activeTaxes.stream()
                            .filter(t -> Boolean.TRUE.equals(t.getIsDefault()))
                            .findFirst().orElse(activeTaxes.isEmpty() ? null : activeTaxes.get(0));
                    if (defaultTax != null) {
                        appliedRate = defaultTax.getRate();
                        totalTax = order.getTotalAmount() * appliedRate / 100.0;
                        totalCgst = totalTax / 2.0;
                        totalSgst = totalTax / 2.0;
                        totalTcs = order.getTotalAmount() * 0.01;
                    }
                }

                double backendTax = Math.round(totalTax * 100.0) / 100.0;
                order.setTaxRate(appliedRate);
                order.setTaxAmount(backendTax);
                order.setCgst(Math.round(totalCgst * 100.0) / 100.0);
                order.setSgst(Math.round(totalSgst * 100.0) / 100.0);
                order.setIgst(Math.round(totalIgst * 100.0) / 100.0);
                order.setCess(Math.round(totalCess * 100.0) / 100.0);
                order.setTcsAmount(Math.round(totalTcs * 100.0) / 100.0);

                // Recalculate totalAmount to be consistent with backend tax calculation
                if (order.getTotalAmount() != null) {
                    double frontendTax = order.getTaxAmount() != null ? order.getTaxAmount() : 0;
                    // The frontend sends totalAmount already including its tax calculation.
                    // Subtract frontend tax and add backend tax to keep totals consistent.
                    order.setTotalAmount(order.getTotalAmount() - frontendTax + backendTax);
                }

                // Deduct stock for ordered products
                if (order.getProductQuantities() != null) {
                        for (Map.Entry<Long, Integer> entry : order.getProductQuantities().entrySet()) {
                                Long productId = entry.getKey();
                                Integer quantity = entry.getValue();
                                productRepository.findById(productId).ifPresent(product -> {
                                        Integer currentStock = product.getInitialStock();
                                        if (currentStock != null) {
                                                int newStock = Math.max(0, currentStock - quantity);
                                                int oldStock = product.getInitialStock();
                                                product.setInitialStock(newStock);

                                                // Log stock movement
                                                try {
                                                    stockMovementService.logFromProduct(product, product.getVendorId(),
                                                        "OUT", quantity,
                                                        oldStock, newStock,
                                                        "Order " + (order.getOrderNumber() != null ? order.getOrderNumber() : "#" + order.getId()),
                                                        "System",
                                                        "Stock deducted for new order");
                                                } catch (Exception ignored) {}

                                                if (newStock == 0) {
                                                        product.setStatus("out");
                                                        // Notify vendor about out of stock
                                                        if (product.getVendorId() != null) {
                                                                Notification notification = new Notification();
                                                                notification.setVendorId(product.getVendorId());
                                                                notification.setTitle("Out of Stock");
                                                                notification.setMessage("Product " + product.getName()
                                                                                + " is now out of stock.");
                                                                notification.setType("OUT_OF_STOCK");
                                                                notificationService.createNotification(notification);
                                                        }
                                                } else if (newStock <= 5) {
                                                        product.setStatus("low");
                                                        // Notify vendor about low stock
                                                        if (product.getVendorId() != null) {
                                                                Notification notification = new Notification();
                                                                notification.setVendorId(product.getVendorId());
                                                                notification.setTitle("Low Stock Warning");
                                                                notification.setMessage("Product " + product.getName()
                                                                                + " has low stock (" + newStock
                                                                                + " remaining).");
                                                                notification.setType("LOW_STOCK");
                                                                notificationService.createNotification(notification);
                                                        }
                                                }
                                                productRepository.save(product);
                                        }
                                });
                        }
                }

                Order savedOrder = orderRepository.save(order);

                // Send order confirmation email to the customer
                try {
                    if (savedOrder.getUserId() != null) {
                        User customer = userService.getUserById(savedOrder.getUserId());
                        if (customer != null && customer.getEmail() != null) {
                            String customerName = customer.getFullName() != null ? customer.getFullName() : "Customer";
                            emailService.sendOrderConfirmationEmail(
                                customer.getEmail(),
                                customerName,
                                savedOrder.getOrderNumber(),
                                savedOrder.getTotalAmount() != null ? savedOrder.getTotalAmount() : 0,
                                savedOrder.getStatus()
                            );
                        }
                    }
                } catch (Exception e) {
                    // Log but don't fail order creation if email sending fails
                    System.err.println("Failed to send order confirmation email: " + e.getMessage());
                }

                // Notify vendor about new order
                if (savedOrder.getVendorId() != null) {
                        boolean isWholesale = savedOrder.getWholesalerId() != null;
                        Notification notification = new Notification();
                        notification.setVendorId(savedOrder.getVendorId());
                        notification.setTitle(isWholesale ? "New Wholesale Order Received" : "New Order Received");
                        String wsInfo = "";
                        if (isWholesale) {
                            try {
                                wsInfo = wholesalerRepository.findById(savedOrder.getWholesalerId())
                                    .map(w -> " from " + (w.getBusinessName() != null ? w.getBusinessName() : w.getFullName()))
                                    .orElse("");
                            } catch (Exception ignored) {}
                        }
                        notification.setMessage("You have received a new " + (isWholesale ? "wholesale " : "") + "order "
                            + savedOrder.getOrderNumber() + wsInfo + ".");
                        notification.setType("ORDER");
                        notificationService.createNotification(notification);
                }

                return savedOrder;
        }

        public List<Order> getVendorOrders(Long vendorId) {
                return orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);
        }

        public Order updateOrderStatus(Long id, String status) {
                Order order = orderRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
                order.setStatus(status);
                Order updatedOrder = orderRepository.save(order);

                // Send order status update email to the customer
                try {
                    if (updatedOrder.getUserId() != null) {
                        User customer = userService.getUserById(updatedOrder.getUserId());
                        if (customer != null && customer.getEmail() != null) {
                            String customerName = customer.getFullName() != null ? customer.getFullName() : "Customer";
                            emailService.sendOrderStatusEmail(
                                customer.getEmail(),
                                customerName,
                                updatedOrder.getOrderNumber(),
                                status,
                                null // tracking info can be added later when delivery partner integration exists
                            );
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Failed to send order status email: " + e.getMessage());
                }

                // Set deliveredAt timestamp when order is delivered
                if ("DELIVERED".equalsIgnoreCase(status) && updatedOrder.getDeliveredAt() == null) {
                    updatedOrder.setDeliveredAt(Instant.now().toEpochMilli());
                    updatedOrder = orderRepository.save(updatedOrder);
                }

                // Auto-earn loyalty points when order is delivered (5% of total as points)
                if ("DELIVERED".equalsIgnoreCase(status) && updatedOrder.getUserId() != null) {
                    try {
                        LoyaltyCustomer loyalty = loyaltyCustomerRepository.findByUserId(updatedOrder.getUserId()).orElse(null);
                        if (updatedOrder.getTotalAmount() != null) {
                            // Auto-create loyalty record if it doesn't exist yet
                            if (loyalty == null) {
                                loyalty = new LoyaltyCustomer();
                                loyalty.setUserId(updatedOrder.getUserId());
                                loyalty.setName(updatedOrder.getCustomerName() != null ? updatedOrder.getCustomerName() : "Customer");
                                loyalty.setEmail("");
                                loyalty.setPoints(0);
                                loyalty.setEarned(0);
                                loyalty.setRedeemed(0);
                                loyalty.setTier("bronze");
                            }
                            int pointsEarned = (int) Math.floor(updatedOrder.getTotalAmount() * 0.05); // 5% back in points
                            if (pointsEarned > 0) {
                                loyalty.setPoints(loyalty.getPoints() + pointsEarned);
                                loyalty.setEarned(loyalty.getEarned() + pointsEarned);
                                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                                loyalty.setLastActivity(sdf.format(new java.util.Date()));
                                // Re-calculate tier
                                int pts = loyalty.getPoints();
                                if (pts >= 20000) loyalty.setTier("platinum");
                                else if (pts >= 5000) loyalty.setTier("gold");
                                else if (pts >= 1000) loyalty.setTier("silver");
                                else loyalty.setTier("bronze");
                                loyaltyCustomerRepository.save(loyalty);

                                // Record transaction
                                LoyaltyTransaction tx = new LoyaltyTransaction();
                                tx.setUserId(updatedOrder.getUserId());
                                tx.setType("EARNED");
                                tx.setPoints(pointsEarned);
                                tx.setReason("Order delivered");
                                tx.setReference(updatedOrder.getOrderNumber());
                                loyaltyTransactionRepository.save(tx);

                                // Send loyalty notification (to vendor for awareness; customer notified via loyalty page)
                                try {
                                    if (updatedOrder.getVendorId() != null) {
                                        Notification notif = new Notification();
                                        notif.setVendorId(updatedOrder.getVendorId());
                                        notif.setTitle("Loyalty Points Awarded");
                                        notif.setMessage("Customer earned " + pointsEarned + " loyalty points from order " + updatedOrder.getOrderNumber() + ".");
                                        notif.setType("PLATFORM");
                                        notificationService.createNotification(notif);
                                    }
                                } catch (Exception ignored) {}
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to award loyalty points: " + e.getMessage());
                    }
                }

                // Notify vendor if order is cancelled or rejected
                if (("CANCELLED".equalsIgnoreCase(status) || "REJECTED".equalsIgnoreCase(status))
                                && updatedOrder.getVendorId() != null) {
                        Notification notification = new Notification();
                        notification.setVendorId(updatedOrder.getVendorId());
                        notification.setTitle(
                                        "Order " + (status.equalsIgnoreCase("REJECTED") ? "Rejected" : "Cancelled"));
                        notification.setMessage("Order " + updatedOrder.getOrderNumber() + " has been "
                                        + status.toLowerCase() + ".");
                        notification.setType("ORDER");
                        notificationService.createNotification(notification);
                }

                return updatedOrder;
        }

        /**
         * Bulk update status for multiple orders (vendor-facing).
         * Updates all orders that belong to the specified vendor.
         * @param orderIds List of order IDs to update
         * @param newStatus Target status
         * @param vendorId Vendor ID for ownership validation
         * @return Map with success/failure counts
         */
        @Transactional
        public java.util.Map<String, Object> bulkUpdateOrderStatus(List<Long> orderIds, String newStatus, Long vendorId) {
            int success = 0;
            int failed = 0;
            java.util.List<String> errors = new java.util.ArrayList<>();

            for (Long orderId : orderIds) {
                try {
                    Order order = orderRepository.findById(orderId)
                        .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

                    // Validate vendor ownership
                    if (!order.getVendorId().equals(vendorId)) {
                        errors.add("Order " + orderId + " does not belong to this vendor");
                        failed++;
                        continue;
                    }

                    // Use existing updateOrderStatus for all side effects (email, loyalty points, notifications)
                    updateOrderStatus(orderId, newStatus);
                    success++;
                } catch (Exception e) {
                    errors.add("Order " + orderId + ": " + e.getMessage());
                    failed++;
                }
            }

            java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
            result.put("successCount", success);
            result.put("failedCount", failed);
            result.put("totalCount", orderIds.size());
            result.put("newStatus", newStatus);
            if (!errors.isEmpty()) {
                result.put("errors", errors);
            }
            return result;
        }

        /**
         * Allows a customer to cancel their own order if it's still in PROCESSING status.
         * Only orders in PROCESSING or ACCEPTED status can be cancelled by the customer.
         */
        public Order cancelOrderByCustomer(Long orderId, Long userId) {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

                // Verify the order belongs to this user
                if (order.getUserId() == null || !order.getUserId().equals(userId)) {
                        throw new RuntimeException("Access denied: this order does not belong to you");
                }

                // Only allow cancellation of PROCESSING orders
                String status = order.getStatus().toUpperCase();
                if (!"PROCESSING".equals(status) && !"ACCEPTED".equals(status)) {
                        throw new RuntimeException(
                                "Order can only be cancelled while it is in PROCESSING status. Current status: "
                                + order.getStatus());
                }

                order.setStatus("CANCELLED");
                Order cancelledOrder = orderRepository.save(order);

                // Restore stock for cancelled products
                if (cancelledOrder.getProductQuantities() != null) {
                        for (Map.Entry<Long, Integer> entry : cancelledOrder.getProductQuantities().entrySet()) {
                                Long productId = entry.getKey();
                                Integer quantity = entry.getValue();
                                productRepository.findById(productId).ifPresent(product -> {
                                        Integer currentStock = product.getInitialStock();
                                        if (currentStock != null) {
                                                int oldStock = product.getInitialStock();
                                                product.setInitialStock(currentStock + quantity);
                                                product.setStatus("in");

                                                // Log stock movement
                                                try {
                                                    stockMovementService.logFromProduct(product, product.getVendorId(),
                                                        "IN", quantity,
                                                        oldStock, product.getInitialStock(),
                                                        "Cancellation " + (cancelledOrder.getOrderNumber() != null ? cancelledOrder.getOrderNumber() : "#" + cancelledOrder.getId()),
                                                        "System",
                                                        "Stock restored from cancelled order");
                                                } catch (Exception ignored) {}

                                                productRepository.save(product);
                                        }
                                });
                        }
                }

                // Notify vendor about cancellation
                if (cancelledOrder.getVendorId() != null) {
                        Notification notification = new Notification();
                        notification.setVendorId(cancelledOrder.getVendorId());
                        notification.setTitle("Order Cancelled by Customer");
                        notification.setMessage(
                                "Order " + cancelledOrder.getOrderNumber() + " has been cancelled by the customer.");
                        notification.setType("ORDER");
                        notificationService.createNotification(notification);
                }

                // Send cancellation email
                try {
                    if (cancelledOrder.getUserId() != null) {
                        User customer = userService.getUserById(cancelledOrder.getUserId());
                        if (customer != null && customer.getEmail() != null) {
                            emailService.sendOrderStatusEmail(
                                customer.getEmail(),
                                customer.getFullName() != null ? customer.getFullName() : "Customer",
                                cancelledOrder.getOrderNumber(),
                                "CANCELLED",
                                null
                            );
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Failed to send cancellation email: " + e.getMessage());
                }

                return cancelledOrder;
        }

        public Order submitReturnRequest(Long orderId, String reason, List<MultipartFile> images) throws IOException {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

                order.setStatus("RETURN REQUESTED");
                order.setReturnReason(reason);

                if (images != null && !images.isEmpty()) {
                        String returnUploadDir = Paths.get(uploadDir, "returns").toAbsolutePath().normalize().toString();
                        File uploadDirectory = new File(returnUploadDir);
                        if (!uploadDirectory.exists()) {
                                uploadDirectory.mkdirs();
                        }

                        if (order.getReturnImages() == null) {
                                order.setReturnImages(new java.util.ArrayList<>());
                        }

                        for (MultipartFile file : images) {
                                if (!file.isEmpty()) {
                                        String fileName = UUID.randomUUID().toString() + "_"
                                                        + file.getOriginalFilename();
                                        java.nio.file.Path filePath = java.nio.file.Paths.get(returnUploadDir, fileName);
                                        java.nio.file.Files.copy(file.getInputStream(), filePath);
                                        order.getReturnImages().add(fileName);
                                }
                        }
                }

                Order savedOrder = orderRepository.save(order);

                // Notify vendor about return request
                if (savedOrder.getVendorId() != null) {
                        Notification notification = new Notification();
                        notification.setVendorId(savedOrder.getVendorId());
                        notification.setTitle("Return Requested");
                        notification.setMessage(
                                        "A return has been requested for order " + savedOrder.getOrderNumber() + ".");
                        notification.setType("ORDER");
                        notificationService.createNotification(notification);
                }

                return savedOrder;
        }

        public void generateMockOrders(Long userId) {
                Order processingOrder = new Order();
                processingOrder.setUserId(userId);
                processingOrder.setOrderNumber("#EH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                processingOrder.setDatePlaced(Instant.now().toEpochMilli());
                processingOrder.setTotalAmount(320.75);
                processingOrder.setStatus("PROCESSING");
                processingOrder.setImages(Arrays.asList(
                                "https://images.unsplash.com/photo-1601369342730-80410ff1a92a?auto=format&fit=crop&q=80&w=150",
                                "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=150"));
                processingOrder.setAdditionalItems(0);
                processingOrder.setImpactNote(
                                "This high-impact purchase is contributing to a micro-loan fund for 12 new women-led startups in the artisan sector.");

                Order shippedOrder = new Order();
                shippedOrder.setUserId(userId);
                shippedOrder.setOrderNumber("#EH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                shippedOrder.setDatePlaced(Instant.now().toEpochMilli() - (86400000L * 3)); // 3 days ago
                shippedOrder.setTotalAmount(65.00);
                shippedOrder.setStatus("SHIPPED");
                shippedOrder.setImages(Arrays.asList(
                                "https://images.unsplash.com/photo-1596646549248-6a56f082e6d9?auto=format&fit=crop&q=80&w=150"));
                shippedOrder.setAdditionalItems(0);
                shippedOrder.setImpactNote(
                                "Your support funded healthcare workshops for a community of basket weavers in rural Vietnam.");

                Order deliveredOrder = new Order();
                deliveredOrder.setUserId(userId);
                deliveredOrder.setOrderNumber("#EH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                deliveredOrder.setDatePlaced(Instant.now().toEpochMilli() - (86400000L * 15)); // 15 days ago
                deliveredOrder.setTotalAmount(184.50);
                deliveredOrder.setStatus("DELIVERED");
                deliveredOrder.setImages(Arrays.asList(
                                "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&q=80&w=150",
                                "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=150"));
                deliveredOrder.setAdditionalItems(1);
                deliveredOrder.setImpactNote(
                                "This purchase provided 3 days of fair wages for a weaving cooperative in Cusco, Peru, supporting education for 5 local children.");

                orderRepository.saveAll(Arrays.asList(processingOrder, shippedOrder, deliveredOrder));
        }

        public Order getOrderByOrderNumber(String orderNumber) {
                return orderRepository.findByOrderNumber(orderNumber)
                                .orElseThrow(() -> new RuntimeException("Order not found: " + orderNumber));
        }

        public Order getOrderById(Long id) {
                return orderRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
        }
}
