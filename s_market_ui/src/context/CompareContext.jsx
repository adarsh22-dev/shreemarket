import React, { createContext, useContext, useState, useEffect } from 'react';

const CompareContext = createContext();

export const useCompare = () => useContext(CompareContext);

export const CompareProvider = ({ children }) => {
    const [compareItems, setCompareItems] = useState(() => {
        try {
            const saved = localStorage.getItem('compareItems');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('compareItems', JSON.stringify(compareItems));
    }, [compareItems]);

    const addToCompare = (product) => {
        setCompareItems(prev => {
            if (prev.find(p => p.id === product.id)) return prev;
            if (prev.length >= 4) {
                return [...prev.slice(1), product];
            }
            return [...prev, product];
        });
    };

    const removeFromCompare = (productId) => {
        setCompareItems(prev => prev.filter(p => p.id !== productId));
    };

    const isInCompare = (productId) => {
        return compareItems.some(p => p.id === productId);
    };

    const clearCompare = () => {
        setCompareItems([]);
    };

    return (
        <CompareContext.Provider value={{ compareItems, addToCompare, removeFromCompare, isInCompare, clearCompare, compareCount: compareItems.length }}>
            {children}
        </CompareContext.Provider>
    );
};
