package com.sreemarket.backend.service;

import com.sreemarket.backend.dto.CartItemRequest;
import com.sreemarket.backend.model.Cart;
import com.sreemarket.backend.model.CartItem;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.repository.CartItemRepository;
import com.sreemarket.backend.repository.CartRepository;
import com.sreemarket.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public Cart getCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setUserId(userId);
            return cartRepository.save(newCart);
        });

        // Populate products for each item
        for (CartItem item : cart.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(item::setProduct);
        }

        return cart;
    }

    @Transactional
    public Cart addItem(Long userId, CartItemRequest request) {
        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setUserId(userId);
            return cartRepository.save(newCart);
        });

        // Check if item already exists with same product and variant
        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(request.getProductId()) &&
                        (item.getVariant() == null ? request.getVariant() == null
                                : item.getVariant().equals(request.getVariant())))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            existingItem.setQuantity(existingItem.getQuantity() + request.getQuantity());
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProductId(request.getProductId());
            newItem.setQuantity(request.getQuantity());
            newItem.setVariant(request.getVariant());

            CartItem savedItem = cartItemRepository.save(newItem);
            cart.getItems().add(savedItem);
        }

        return getCart(userId); // Re-fetch to populate products
    }

    @Transactional
    public Cart updateItemQuantity(Long userId, Long itemId, Integer quantity) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user: " + userId));

        Optional<CartItem> itemOpt = cart.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst();

        if (itemOpt.isPresent()) {
            if (quantity <= 0) {
                cart.getItems().remove(itemOpt.get());
                cartItemRepository.delete(itemOpt.get());
            } else {
                CartItem item = itemOpt.get();
                item.setQuantity(quantity);
                cartItemRepository.save(item);
            }
        }

        return getCart(userId);
    }

    @Transactional
    public Cart removeItem(Long userId, Long itemId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user: " + userId));

        Optional<CartItem> itemOpt = cart.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst();

        if (itemOpt.isPresent()) {
            cart.getItems().remove(itemOpt.get());
            cartItemRepository.delete(itemOpt.get());
        }

        return getCart(userId);
    }

    @Transactional
    public void clearCart(Long userId) {
        Optional<Cart> cartOpt = cartRepository.findByUserId(userId);
        if (cartOpt.isPresent()) {
            Cart cart = cartOpt.get();
            cartItemRepository.deleteByCartId(cart.getId());
            cart.getItems().clear();
        }
    }

    @Transactional
    public Cart mergeGuestCart(Long userId, List<CartItemRequest> guestItems) {
        for (CartItemRequest guestItem : guestItems) {
            addItem(userId, guestItem);
        }
        return getCart(userId);
    }
}
