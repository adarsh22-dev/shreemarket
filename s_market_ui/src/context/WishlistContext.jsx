import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    fetchUserWishlist,
    addToUserWishlist,
    removeUserWishlist,
    PLACEHOLDER_IMG
} from '../api/api';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [userId, setUserId] = useState(null);

    // Watch for login changes
    useEffect(() => {
        const checkUser = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const userObj = JSON.parse(userStr);
                    const newId = userObj.userId || userObj.id || null;
                    setUserId(prev => prev !== newId ? newId : prev);
                } catch (e) { setUserId(null); }
            } else {
                setUserId(null);
            }
        };
        checkUser();
        window.addEventListener('storage', checkUser);
        window.addEventListener('focus', checkUser);
        return () => {
            window.removeEventListener('storage', checkUser);
            window.removeEventListener('focus', checkUser);
        };
    }, []);

    const loadWishlist = async (uid) => {
         setWishlistLoading(true);
         try {
             const items = await fetchUserWishlist(uid);
             // Backend returns list of Wishlist entity, we want the products
             const products = items.map(item => {
                 const p = item.product;
                 const apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : "http://localhost:8082/api";
                 const backendUrl = apiBaseUrl.replace(/\/api$/, '');
                 let image = PLACEHOLDER_IMG;
                 const gallery = (p.media || []).filter(m => m.mediaType !== 'manufacturer');
                 if (gallery.length > 0) {
                     const primaryMedia = gallery.find(m => m.isPrimary) || gallery[0];
                     image = `${backendUrl}/uploads/products/${primaryMedia.fileName}`;
                 }
                 return { ...p, image };
             });
             setWishlistItems(products);
         } catch (error) {
             console.error("Failed to load wishlist:", error);
             toast.error("Failed to load wishlist");
         } finally {
             setWishlistLoading(false);
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
        if (!userId) {
            toast.error('Please log in to add items to your wishlist');
            return;
        }
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
            wishlistLoading,
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
