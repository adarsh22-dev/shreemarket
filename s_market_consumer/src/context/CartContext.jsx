'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import {
  fetchUserCart,
  addToUserCart,
  updateUserCartItem,
  removeUserCartItem,
  clearUserCart,
  mergeUserCart,
  moveToSavedAPI,
  moveToCartFromSavedAPI
} from '@/lib/api/client';
import { BACKEND_URL } from '@/lib/api/shared';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const mapBackendItems = (backendItems) => {
  return backendItems.map(bItem => {
    const p = bItem.product || {};
    let image = "https://placehold.co/400x400?text=No+Image";
    if (p.media && p.media.length > 0) {
      const primaryMedia = p.media.find(m => m.isPrimary) || p.media[0];
      image = `${BACKEND_URL}/uploads/products/${primaryMedia.fileName}`;
    }

    let parsedVariant = bItem.variant;
    try { if (typeof bItem.variant === 'string' && bItem.variant.startsWith('{')) parsedVariant = JSON.parse(bItem.variant); } catch (e) { }

    return {
      ...p,
      cartItemId: bItem.id,
      id: bItem.productId || p.id,
      name: p.name || 'Unknown Product',
      price: p.discountPrice || p.regularPrice || 0,
      image,
      quantity: bItem.quantity,
      variant: parsedVariant,
      isSaved: bItem.isSaved
    };
  });
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { userId } = useAuth();

  const processBackendCart = (items) => {
    const mapped = mapBackendItems(items);
    setCartItems(mapped.filter(i => !i.isSaved));
    setSavedItems(mapped.filter(i => i.isSaved));
  };

  const loadCentralCart = async (uid) => {
    try {
      const cart = await fetchUserCart(uid);
      if (cart && cart.items) {
        processBackendCart(cart.items);
      }
    } catch (e) {
      console.error("Failed to load central cart", e);
    }
  };

  // Centralized cart sync logic
  useEffect(() => {
    if (userId) {
      const localCartStr = localStorage.getItem('s_market_cart');
      const localSavedStr = localStorage.getItem('s_market_saved');

      const localCart = localCartStr ? JSON.parse(localCartStr) : [];
      const localSaved = localSavedStr ? JSON.parse(localSavedStr) : [];

      if (localCart.length > 0 || localSaved.length > 0) {
        const itemsToMerge = [
          ...localCart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            variant: typeof item.variant === 'object' ? JSON.stringify(item.variant) : item.variant,
            isSaved: false
          })),
          ...localSaved.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            variant: typeof item.variant === 'object' ? JSON.stringify(item.variant) : item.variant,
            isSaved: true
          }))
        ];

        mergeUserCart(userId, itemsToMerge)
          .then(cart => {
            localStorage.removeItem('s_market_cart');
            localStorage.removeItem('s_market_saved');
            if (cart && cart.items) processBackendCart(cart.items);
          })
          .catch(e => {
            console.error("Failed to merge cart. Falling back to fetch.", e);
            loadCentralCart(userId);
          });
      } else {
        loadCentralCart(userId);
      }
    } else {
      // Load from local storage for guests
      const savedCart = localStorage.getItem('s_market_cart');
      const savedLater = localStorage.getItem('s_market_saved');

      if (savedCart) {
        try { setCartItems(JSON.parse(savedCart)); }
        catch (e) { console.error("Failed to parse cart", e); }
      } else {
        setCartItems([]);
      }

      if (savedLater) {
        try { setSavedItems(JSON.parse(savedLater)); }
        catch (e) { console.error("Failed to parse saved items", e); }
      } else {
        setSavedItems([]);
      }
    }
  }, [userId]);

  // Load recently viewed
  useEffect(() => {
    const saved = localStorage.getItem('s_market_recent');
    if (saved) {
      try { setRecentlyViewed(JSON.parse(saved)); } catch (e) { }
    }
  }, []);

  // Save guest state to local storage
  useEffect(() => {
    if (!userId) {
      localStorage.setItem('s_market_cart', JSON.stringify(cartItems));
      localStorage.setItem('s_market_saved', JSON.stringify(savedItems));
    }
  }, [cartItems, savedItems, userId]);

  // Save recently viewed
  useEffect(() => {
    localStorage.setItem('s_market_recent', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const addToCart = async (product, quantity = 1, variant = null, openCartOnAdd = true) => {
    if (userId) {
      try {
        const itemData = {
          productId: product.id,
          quantity,
          variant: typeof variant === 'object' ? JSON.stringify(variant) : variant,
          isSaved: false
        };
        const updatedCart = await addToUserCart(userId, itemData);
        if (updatedCart && updatedCart.items) processBackendCart(updatedCart.items);
        if (openCartOnAdd) setIsCartOpen(true);
      } catch (e) { console.error("Failed to add to backend cart", e); }
    } else {
      setCartItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item =>
          item.id === product.id && JSON.stringify(item.variant) === JSON.stringify(variant)
        );

        if (existingItemIndex > -1) {
          const newItems = [...prevItems];
          newItems[existingItemIndex].quantity += quantity;
          return newItems;
        } else {
          let finalImage = product.image;
          if (!finalImage && product.media && product.media.length > 0) {
            const primaryMedia = product.media.find(m => m.isPrimary) || product.media[0];
            finalImage = `${BACKEND_URL}/uploads/products/${primaryMedia.fileName}`;
          }
          return [...prevItems, { ...product, image: finalImage, quantity, variant }];
        }
      });
      if (openCartOnAdd) setIsCartOpen(true);
    }
  };

  const removeFromCart = async (id, variant = null) => {
    if (userId) {
      const item = cartItems.find(i => i.id === id && JSON.stringify(i.variant) === JSON.stringify(variant));
      if (item && item.cartItemId) {
        try {
          const updatedCart = await removeUserCartItem(userId, item.cartItemId);
          if (updatedCart && updatedCart.items) processBackendCart(updatedCart.items);
        } catch (e) { console.error("Failed to remove from backend cart", e); }
      }
    } else {
      setCartItems(prevItems => prevItems.filter(item =>
        !(item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant))
      ));
    }
  };

  const updateQuantity = async (id, newQuantity, variant = null) => {
    if (newQuantity < 1) return;

    if (userId) {
      const item = cartItems.find(i => i.id === id && JSON.stringify(i.variant) === JSON.stringify(variant))
        || savedItems.find(i => i.id === id && JSON.stringify(i.variant) === JSON.stringify(variant));

      if (item && item.cartItemId) {
        try {
          const updatedCart = await updateUserCartItem(userId, item.cartItemId, newQuantity);
          if (updatedCart && updatedCart.items) processBackendCart(updatedCart.items);
        } catch (e) { console.error("Failed to update backend cart quantity", e); }
      }
    } else {
      const updateList = (list) => list.map(item =>
        (item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant))
          ? { ...item, quantity: newQuantity }
          : item
      );
      setCartItems(prev => updateList(prev));
      setSavedItems(prev => updateList(prev));
    }
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const closeCart = () => setIsCartOpen(false);

  const saveForLater = async (id, variant = null) => {
    if (userId) {
      const item = cartItems.find(i => i.id === id && JSON.stringify(i.variant) === JSON.stringify(variant));
      if (item && item.cartItemId) {
        try {
          const updatedCart = await moveToSavedAPI(userId, item.cartItemId);
          if (updatedCart && updatedCart.items) processBackendCart(updatedCart.items);
        } catch (e) { console.error("Failed to move to saved in backend", e); }
      }
    } else {
      const itemToSave = cartItems.find(item => item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant));
      if (itemToSave) {
        setSavedItems(prev => [...prev, itemToSave]);
        setCartItems(prev => prev.filter(item =>
          !(item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant))
        ));
      }
    }
  };

  const moveToCart = async (id, variant = null) => {
    if (userId) {
      const item = savedItems.find(i => i.id === id && JSON.stringify(i.variant) === JSON.stringify(variant));
      if (item && item.cartItemId) {
        try {
          const updatedCart = await moveToCartFromSavedAPI(userId, item.cartItemId);
          if (updatedCart && updatedCart.items) processBackendCart(updatedCart.items);
        } catch (e) { console.error("Failed to move back to cart in backend", e); }
      }
    } else {
      const itemToMove = savedItems.find(item => item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant));
      if (itemToMove) {
        setCartItems(prev => [...prev, itemToMove]);
        setSavedItems(prev => prev.filter(item =>
          !(item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant))
        ));
      }
    }
  };

  const removeFromSaved = async (id, variant = null) => {
    if (userId) {
      const item = savedItems.find(i => i.id === id && JSON.stringify(i.variant) === JSON.stringify(variant));
      if (item && item.cartItemId) {
        try {
          const updatedCart = await removeUserCartItem(userId, item.cartItemId);
          if (updatedCart && updatedCart.items) processBackendCart(updatedCart.items);
        } catch (e) { console.error("Failed to remove saved item in backend", e); }
      }
    } else {
      setSavedItems(prev => prev.filter(item =>
        !(item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant))
      ));
    }
  };

  const addToRecentlyViewed = (product) => {
    if (!product || !product.id) return;
    setRecentlyViewed(prev => {
      const filtered = prev.filter(item => item.id !== product.id);
      return [product, ...filtered].slice(0, 10);
    });
  };

  const clearCartFn = async () => {
    if (userId) {
      try {
        await clearUserCart(userId);
        processBackendCart([]);
      } catch (e) { console.error("Failed to clear backend cart", e); }
    } else {
      setCartItems([]);
    }
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + ((item.price || item.discountPrice || item.regularPrice || 0) * item.quantity), 0);

  const isProductInCart = (id, variant = null) => {
    return cartItems.some(item =>
      item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant)
    );
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      savedItems,
      isCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      toggleCart,
      closeCart,
      saveForLater,
      moveToCart,
      removeFromSaved,
      recentlyViewed,
      addToRecentlyViewed,
      clearCart: clearCartFn,
      cartCount,
      cartTotal,
      isProductInCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
