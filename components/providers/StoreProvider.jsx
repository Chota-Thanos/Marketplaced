'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, getStoredAuth, setStoredAuth, clearStoredAuth } from '../../lib/apiClient';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [authUser, setAuthUser] = useState(null);

  // Load from localStorage on mount (if available)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bazaarx_cart');
      if (saved) setCartItems(JSON.parse(saved));
    } catch (e) { /* non-critical: ignore */ }

    const { token, user } = getStoredAuth();
    if (token) { setAuthToken(token); setAuthUser(user); }

    // apiFetch fires this when the API rejects our token.
    const onUnauthorized = () => { setAuthToken(null); setAuthUser(null); };
    window.addEventListener('bazaarx:unauthorized', onUnauthorized);
    return () => window.removeEventListener('bazaarx:unauthorized', onUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
    setStoredAuth(res.data.token, res.data.user);
    setAuthToken(res.data.token);
    setAuthUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, phone, password) => {
    const res = await apiFetch('/auth/register', { method: 'POST', body: { name, email, phone, password } });
    setStoredAuth(res.data.token, res.data.user);
    setAuthToken(res.data.token);
    setAuthUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    clearStoredAuth();
    setAuthToken(null);
    setAuthUser(null);
  };

  /** Keep the cached user in sync after a profile edit. */
  const updateAuthUser = (user) => {
    setAuthUser(user);
    if (authToken) setStoredAuth(authToken, user);
  };

  // Save to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('bazaarx_cart', JSON.stringify(cartItems));
    } catch (e) { /* non-critical: ignore */ }
  }, [cartItems]);

  const handleAddToCart = (product, variant = null) => {
    setCartItems((prev) => {
      const cartItemId = variant ? `${product.id}-${variant.id}` : product.id;
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        ...product, 
        cartItemId, 
        variantId: variant?.id,
        variantName: variant ? [variant.color, variant.size].filter(Boolean).join(' - ') : null,
        quantity: 1 
      }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQty = (cartItemId, newQty) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item))
      );
    }
  };

  const handleRemoveItem = (cartItemId) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        cartItems,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        isVoiceOpen,
        setIsVoiceOpen,
        handleAddToCart,
        handleUpdateQty,
        handleRemoveItem,
        clearCart,
        authToken,
        authUser,
        login,
        register,
        logout,
        updateAuthUser,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
