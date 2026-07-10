import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';

interface CompareContextType {
  compareIds: number[];
  addToCompare: (productId: number) => void;
  removeFromCompare: (productId: number) => void;
  toggleCompare: (productId: number) => void;
  isCompared: (productId: number) => boolean;
  clearCompare: () => void;
  compareCount: number;
  MAX_COMPARE: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const MAX_COMPARE = 4;

  const addToCompare = useCallback((productId: number) => {
    setCompareIds(prev => {
      if (prev.includes(productId)) return prev;
      if (prev.length >= MAX_COMPARE) {
        Alert.alert('Compare Limit', `You can compare up to ${MAX_COMPARE} products at a time.`);
        return prev;
      }
      return [...prev, productId];
    });
  }, []);

  const removeFromCompare = useCallback((productId: number) => {
    setCompareIds(prev => prev.filter(id => id !== productId));
  }, []);

  const toggleCompare = useCallback((productId: number) => {
    setCompareIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      if (prev.length >= MAX_COMPARE) {
        Alert.alert('Compare Limit', `You can compare up to ${MAX_COMPARE} products at a time.`);
        return prev;
      }
      return [...prev, productId];
    });
  }, []);

  const isCompared = useCallback((productId: number) => {
    return compareIds.includes(productId);
  }, [compareIds]);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
  }, []);

  return (
    <CompareContext.Provider value={{
      compareIds,
      addToCompare,
      removeFromCompare,
      toggleCompare,
      isCompared,
      clearCompare,
      compareCount: compareIds.length,
      MAX_COMPARE,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
