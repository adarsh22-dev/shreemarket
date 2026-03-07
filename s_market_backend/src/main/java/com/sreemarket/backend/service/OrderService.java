package com.sreemarket.backend.service;

import com.sreemarket.backend.model.Order;
import com.sreemarket.backend.repository.OrderRepository;
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

@Service
public class OrderService {

        @Autowired
        private OrderRepository orderRepository;

        @Autowired
        private ProductRepository productRepository;

        @Autowired
        private NotificationService notificationService;

        public List<Order> getUserOrders(Long userId) {
                return orderRepository.findByUserIdOrderByDatePlacedDesc(userId);
        }

        @Transactional
        public Order createOrder(Order order) {
                order.setDatePlaced(Instant.now().toEpochMilli());

                // Deduct stock for ordered products
                if (order.getProductQuantities() != null) {
                        for (Map.Entry<Long, Integer> entry : order.getProductQuantities().entrySet()) {
                                Long productId = entry.getKey();
                                Integer quantity = entry.getValue();
                                productRepository.findById(productId).ifPresent(product -> {
                                        Integer currentStock = product.getInitialStock();
                                        if (currentStock != null) {
                                                int newStock = Math.max(0, currentStock - quantity);
                                                product.setInitialStock(newStock);
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

                // Notify vendor about new order
                if (savedOrder.getVendorId() != null) {
                        Notification notification = new Notification();
                        notification.setVendorId(savedOrder.getVendorId());
                        notification.setTitle("New Order Received");
                        notification.setMessage("You have received a new order " + savedOrder.getOrderNumber() + ".");
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

                // Notify vendor if order is cancelled
                if ("CANCELLED".equalsIgnoreCase(status) && updatedOrder.getVendorId() != null) {
                        Notification notification = new Notification();
                        notification.setVendorId(updatedOrder.getVendorId());
                        notification.setTitle("Order Cancelled");
                        notification.setMessage("Order " + updatedOrder.getOrderNumber() + " has been cancelled.");
                        notification.setType("ORDER");
                        notificationService.createNotification(notification);
                }

                return updatedOrder;
        }

        public Order submitReturnRequest(Long orderId, String reason, List<MultipartFile> images) throws IOException {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

                order.setStatus("RETURN REQUESTED");
                order.setReturnReason(reason);

                if (images != null && !images.isEmpty()) {
                        String uploadDir = "uploads/returns/";
                        File uploadDirectory = new File(uploadDir);
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
                                        java.nio.file.Path filePath = java.nio.file.Paths.get(uploadDir, fileName);
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
}
