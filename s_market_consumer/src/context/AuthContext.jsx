'use client';

import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { logoutUser } from '@/lib/api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try { setUser(JSON.parse(e.newValue)); } catch { setUser(null); }
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback((userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    // Dispatch storage event for other contexts (CartContext, etc.)
    window.dispatchEvent(new Event('storage'));
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('Logout API failed', e);
    }
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('storage'));
  }, []);

  const userId = user?.userId || user?.id || null;
  const roleId = user?.roleId || null;
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      userId,
      roleId,
      isLoggedIn,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
