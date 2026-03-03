import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [savedItems, setSavedItems] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart and saved items from local storage on init
    useEffect(() => {
        const savedCart = localStorage.getItem('s_market_cart');
        const savedLaterList = localStorage.getItem('s_market_saved');
        const savedRecentlyViewed = localStorage.getItem('s_market_recent');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart from local storage", e);
            }
        }
        if (savedLaterList) {
            try {
                setSavedItems(JSON.parse(savedLaterList));
            } catch (e) {
                console.error("Failed to parse saved items from local storage", e);
            }
        }
        if (savedRecentlyViewed) {
            try {
                setRecentlyViewed(JSON.parse(savedRecentlyViewed));
            } catch (e) {
                console.error("Failed to parse recently viewed from local storage", e);
            }
        }
    }, []);

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('s_market_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Save savedItems to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('s_market_saved', JSON.stringify(savedItems));
    }, [savedItems]);

    // Save recently viewed to local storage
    useEffect(() => {
        localStorage.setItem('s_market_recent', JSON.stringify(recentlyViewed));
    }, [recentlyViewed]);

    const addToCart = (product, quantity = 1, variant = null, openCartOnAdd = true) => {
        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item =>
                item.id === product.id &&
                JSON.stringify(item.variant) === JSON.stringify(variant)
            );

            if (existingItemIndex > -1) {
                // Item exists, update quantity
                const newItems = [...prevItems];
                newItems[existingItemIndex].quantity += quantity;
                return newItems;
            } else {
                // New item
                return [...prevItems, { ...product, quantity, variant }];
            }
        });
        if (openCartOnAdd) {
            setIsCartOpen(true); // Open cart when item is added
        }
    };

    const removeFromCart = (id, variant = null) => {
        setCartItems(prevItems => prevItems.filter(item =>
            !(item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant))
        ));
    };

    const updateQuantity = (id, newQuantity, variant = null) => {
        if (newQuantity < 1) return;
        setCartItems(prevItems => prevItems.map(item =>
            (item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant))
                ? { ...item, quantity: newQuantity }
                : item
        ));
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);
    const closeCart = () => setIsCartOpen(false);

    // Save item for later
    const saveForLater = (id, variant = null) => {
        const itemToSave = cartItems.find(item => item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant));
        if (itemToSave) {
            setSavedItems(prev => [...prev, itemToSave]);
            removeFromCart(id, variant);
        }
    };

    // Move item back to cart
    const moveToCart = (id, variant = null) => {
        const itemToMove = savedItems.find(item => item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant));
        if (itemToMove) {
            addToCart(itemToMove, itemToMove.quantity, itemToMove.variant);
            removeFromSaved(id, variant);
        }
    };

    // Remove item completely from saved items
    const removeFromSaved = (id, variant = null) => {
        setSavedItems(prev => prev.filter(item =>
            !(item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant))
        ));
    };

    // Add product to recently viewed
    const addToRecentlyViewed = (product) => {
        if (!product || !product.id) return;
        setRecentlyViewed(prev => {
            // Remove if already exists to move it to the front
            const filtered = prev.filter(item => item.id !== product.id);
            // Limit to 10 items
            const newList = [product, ...filtered].slice(0, 10);
            return newList;
        });
    };

    const clearCart = () => {
        setCartItems([]);
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
            clearCart,
            cartCount,
            cartTotal,
            isProductInCart
        }}>
            {children}
        </CartContext.Provider>
    );
};
