import React, { createContext, useState, useContext, useEffect } from 'react';
import {
    fetchUserWishlist,
    addToUserWishlist,
    removeUserWishlist
} from '../api/api';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [userId, setUserId] = useState(null);

    // Watch for login changes
    useEffect(() => {
        const checkUser = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const userObj = JSON.parse(userStr);
                    setUserId(userObj.userId || userObj.id || null);
                } catch (e) { setUserId(null); }
            } else {
                setUserId(null);
            }
        };
        checkUser();
        window.addEventListener('storage', checkUser);
        return () => window.removeEventListener('storage', checkUser);
    }, []);

    const loadWishlist = async (uid) => {
        try {
            const items = await fetchUserWishlist(uid);
            // Backend returns list of Wishlist entity, we want the products
            const products = items.map(item => {
                const p = item.product;
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8082/api";
                const backendUrl = apiBaseUrl.replace(/\/api$/, '');
                let image = "https://via.placeholder.com/400x400";
                if (p.media && p.media.length > 0) {
                    const primaryMedia = p.media.find(m => m.isPrimary) || p.media[0];
                    image = `${backendUrl}/uploads/products/${primaryMedia.fileName}`;
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

    // Simplified: No guest saving

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
            isLoggedIn: !!userId
        }}>
            {children}
        </WishlistContext.Provider>
    );
};
