package com.sreemarket.backend.service;

import com.sreemarket.backend.dto.CartItemRequest;
import com.sreemarket.backend.model.Cart;
import com.sreemarket.backend.model.CartItem;
import com.sreemarket.backend.model.Product;
import com.sreemarket.backend.model.WholesaleTier;
import com.sreemarket.backend.repository.CartItemRepository;
import com.sreemarket.backend.repository.CartRepository;
import com.sreemarket.backend.repository.ProductRepository;
import com.sreemarket.backend.repository.WholesaleTierRepository;
import com.sreemarket.backend.repository.WholesalerRepository;
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

    @Autowired
    private WholesalerRepository wholesalerRepository;

    @Autowired
    private WholesaleTierRepository wholesaleTierRepository;

    @Transactional
    public Cart getCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setUserId(userId);
            return cartRepository.save(newCart);
        });

        boolean isWholesaler = wholesalerRepository.findById(userId)
                .map(w -> w.getRoleId() != null && w.getRoleId() == 4L)
                .orElse(false);

        // Populate products and calculate wholesale pricing for each item
        for (CartItem item : cart.getItems()) {
            Optional<Product> productOpt = productRepository.findById(item.getProductId());
            productOpt.ifPresent(item::setProduct);

            if (isWholesaler && productOpt.isPresent()) {
                Product product = productOpt.get();
                if (Boolean.TRUE.equals(product.getSupportsWholesale())
                        && product.getWholesalePrice() != null
                        && item.getQuantity() >= (product.getMinimumWholesaleQuantity() != null ? product.getMinimumWholesaleQuantity() : 1)) {

                    double baseWholesalePrice = product.getWholesalePrice();
                    String tierLabel = null;

                    // Check WholesaleTier for better pricing
                    List<WholesaleTier> tiers = wholesaleTierRepository.findByProductIdOrderByMinQtyAsc(product.getId());
                    for (WholesaleTier tier : tiers) {
                        if (item.getQuantity() >= tier.getMinQty()
                                && (tier.getMaxQty() == null || item.getQuantity() <= tier.getMaxQty())) {
                            baseWholesalePrice = tier.getUnitPrice();
                            tierLabel = "Tier " + tier.getMinQty() + "+";
                            break;
                        }
                    }

                    item.setWholesalePrice(baseWholesalePrice);
                    item.setAppliedTier(tierLabel);

                    double retailPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getRegularPrice() != null ? product.getRegularPrice() : 0;
                    if (retailPrice > baseWholesalePrice) {
                        item.setSavings((retailPrice - baseWholesalePrice) * item.getQuantity());
                    }
                }
            }
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

        // Check if item already exists with same product, variant, and saved status
        Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(request.getProductId()) &&
                        (item.getVariant() == null ? request.getVariant() == null
                                : item.getVariant().equals(request.getVariant()))
                        &&
                        (item.getIsSaved() != null
                                && item.getIsSaved().equals(request.getIsSaved() != null && request.getIsSaved())))
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
            newItem.setIsSaved(request.getIsSaved() != null && request.getIsSaved());

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

    @Transactional
    public Cart moveToSaved(Long userId, Long itemId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user: " + userId));

        Optional<CartItem> itemOpt = cart.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst();

        if (itemOpt.isPresent()) {
            CartItem item = itemOpt.get();
            item.setIsSaved(true);
            cartItemRepository.save(item);
        }

        return getCart(userId);
    }

    @Transactional
    public Cart moveToCartFromSaved(Long userId, Long itemId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user: " + userId));

        Optional<CartItem> itemOpt = cart.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst();

        if (itemOpt.isPresent()) {
            CartItem item = itemOpt.get();
            item.setIsSaved(false);
            cartItemRepository.save(item);
        }

        return getCart(userId);
    }
}
