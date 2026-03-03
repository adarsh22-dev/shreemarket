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

@Service
public class OrderService {

        @Autowired
        private OrderRepository orderRepository;

        @Autowired
        private ProductRepository productRepository;

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
                                                } else if (newStock <= 5) {
                                                        product.setStatus("low");
                                                }
                                                productRepository.save(product);
                                        }
                                });
                        }
                }

                return orderRepository.save(order);
        }

        public List<Order> getVendorOrders(Long vendorId) {
                return orderRepository.findByVendorIdOrderByDatePlacedDesc(vendorId);
        }

        public Order updateOrderStatus(Long id, String status) {
                Order order = orderRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
                order.setStatus(status);
                return orderRepository.save(order);
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
