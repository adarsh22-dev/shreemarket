import React, { createContext, useState, useContext, useEffect } from 'react';
import {
    fetchUserCart,
    addToUserCart,
    updateUserCartItem,
    removeUserCartItem,
    clearUserCart,
    mergeUserCart,
    moveToSavedAPI,
    moveToCartFromSavedAPI,
    PLACEHOLDER_IMG
} from '../api/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// A simple utility to map backend CartItem structure to frontend's expected item format
const mapBackendItems = (backendItems) => {
    return backendItems.map(bItem => {
        const p = bItem.product || {};
        const apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : "http://localhost:8082/api";
        const backendUrl = apiBaseUrl.replace(/\/api$/, '');
        let image = PLACEHOLDER_IMG;
        const gallery = (p.media || []).filter(m => m.mediaType !== 'manufacturer');
        if (gallery.length > 0) {
            const primaryMedia = gallery.find(m => m.isPrimary) || gallery[0];
            image = `${backendUrl}/uploads/products/${primaryMedia.fileName}`;
        }

        let parsedVariant = bItem.variant;
        try { if (typeof bItem.variant === 'string' && bItem.variant.startsWith('{')) parsedVariant = JSON.parse(bItem.variant); } catch (e) { }

        return {
            ...p,
            cartItemId: bItem.id,
            id: bItem.productId || p.id,
            name: p.name || 'Unknown Product',
            price: bItem.wholesalePrice || p.discountPrice || p.regularPrice || 0,
            image: image,
            quantity: bItem.quantity,
            variant: parsedVariant,
            isSaved: bItem.isSaved,
            wholesalePrice: bItem.wholesalePrice,
            savings: bItem.savings,
            appliedTier: bItem.appliedTier
        };
    });
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [savedItems, setSavedItems] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Auth state for cart
    const [userId, setUserId] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

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
            setIsInitialized(true);
        };
        // Run immediately
        checkUser();
        window.addEventListener('storage', checkUser);
        return () => window.removeEventListener('storage', checkUser);
    }, []);

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

    // Centralised cart sync logic
    useEffect(() => {
        if (!isInitialized) return;

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
    }, [userId, isInitialized]);

    // Load recently viewed consistently
    useEffect(() => {
        const savedRecentlyViewed = localStorage.getItem('s_market_recent');
        if (savedRecentlyViewed) {
            try { setRecentlyViewed(JSON.parse(savedRecentlyViewed)); }
            catch (e) { }
        }
    }, []);

    // Save Guest state to local storage
    useEffect(() => {
        if (!userId) {
            localStorage.setItem('s_market_cart', JSON.stringify(cartItems));
            localStorage.setItem('s_market_saved', JSON.stringify(savedItems));
        }
    }, [cartItems, savedItems, userId]);

    // Save recently viewed to local storage
    useEffect(() => {
        localStorage.setItem('s_market_recent', JSON.stringify(recentlyViewed));
    }, [recentlyViewed]);

    const addToCart = async (product, quantity = 1, variant = null, openCartOnAdd = true) => {
        if (userId) {
            try {
                const itemData = {
                    productId: product.id,
                    quantity: quantity,
                    variant: typeof variant === 'object' ? JSON.stringify(variant) : variant,
                    isSaved: false
                };
                const updatedCart = await addToUserCart(userId, itemData);
                if (updatedCart && updatedCart.items) {
                    processBackendCart(updatedCart.items);
                }
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
                    // Proactively resolve image if missing to avoid broken thumbnails in dropdown
                    let finalImage = product.image;
                    if (!finalImage) {
                        const gallery = (product.media || []).filter(m => m.mediaType !== 'manufacturer');
                        if (gallery.length > 0) {
        const apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : "http://localhost:8082/api";
                            const backendUrl = apiBaseUrl.replace(/\/api$/, '');
                            const primaryMedia = gallery.find(m => m.isPrimary) || gallery[0];
                            finalImage = `${backendUrl}/uploads/products/${primaryMedia.fileName}`;
                        }
                    }

                    const user = JSON.parse(localStorage.getItem('user') || 'null');
                    const isWholesaler = user?.roleId === 4;
                    return [...prevItems, { ...product, image: finalImage, price: isWholesaler && product.wholesalePrice ? product.wholesalePrice : product.price || product.discountPrice || product.regularPrice || 0, quantity, variant }];
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

    // Save item for later
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

    // Move item back to cart
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

    // Remove item completely from saved items
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

    // Add product to recently viewed
    const addToRecentlyViewed = (product) => {
        if (!product || !product.id) return;
        setRecentlyViewed(prev => {
            const filtered = prev.filter(item => item.id !== product.id);
            const newList = [product, ...filtered].slice(0, 10);
            return newList;
        });
    };

    const clearCart = async () => {
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
    const cartTotal = cartItems.reduce((total, item) => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const isWholesaler = user?.roleId === 4;
        const unitPrice = isWholesaler && item.wholesalePrice ? item.wholesalePrice : item.price || item.discountPrice || item.regularPrice || 0;
        return total + (unitPrice * item.quantity);
    }, 0);

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
            clearCart,
            cartCount,
            cartTotal,
            isProductInCart,
            isInitialized
        }}>
            {children}
        </CartContext.Provider>
    );
};
