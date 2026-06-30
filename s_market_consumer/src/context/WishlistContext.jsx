'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import {
  fetchUserWishlist,
  addToUserWishlist,
  removeUserWishlist
} from '@/lib/api/client';
import { BACKEND_URL } from '@/lib/api/shared';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const { userId, isLoggedIn } = useAuth();

  const loadWishlist = async (uid) => {
    try {
      const items = await fetchUserWishlist(uid);
      const products = items.map(item => {
        const p = item.product;
        let image = "https://placehold.co/400x400?text=No+Image";
        if (p.media && p.media.length > 0) {
          const primaryMedia = p.media.find(m => m.isPrimary) || p.media[0];
          image = `${BACKEND_URL}/uploads/products/${primaryMedia.fileName}`;
        }
        return { ...p, image };
      });
      setWishlistItems(products);
    } catch (e) {
      console.error("Failed to load wishlist", e);
    }
  };

  useEffect(() => {
    if (userId) {
      loadWishlist(userId);
    } else {
      setWishlistItems([]);
    }
  }, [userId]);

  const addToWishlist = async (product) => {
    if (!userId) return;
    try {
      await addToUserWishlist(userId, product.id);
      loadWishlist(userId);
    } catch (e) { console.error("Failed to add to backend wishlist", e); }
  };

  const removeFromWishlist = async (productId) => {
    if (!userId) return;
    try {
      await removeUserWishlist(userId, productId);
      loadWishlist(userId);
    } catch (e) { console.error("Failed to remove from backend wishlist", e); }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      wishlistCount: wishlistItems.length,
      isLoggedIn
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
