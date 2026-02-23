import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useContext as useReactContext } from 'react';
import { AuthContext } from './AuthContext';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { user } = useReactContext(AuthContext);
  const [items, setItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch cart when user is authenticated
  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setCartCount(0);
      return;
    }
    try {
      setLoading(true);
      const data = await apiFetch('/api/cart');
      setItems(data.items || []);
      setCartCount((data.items || []).length);
    } catch {
      setItems([]);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (packageId) => {
    try {
      const data = await apiFetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ packageId }),
      });
      setCartCount(data.count);
      // Re-fetch to get populated data
      await fetchCart();
      return { success: true };
    } catch (err) {
      if (err.status === 409) {
        return { success: false, message: 'Already in cart' };
      }
      return { success: false, message: err.message || 'Failed to add to cart' };
    }
  }, [fetchCart]);

  const removeFromCart = useCallback(async (packageId) => {
    try {
      const data = await apiFetch(`/api/cart/${packageId}`, { method: 'DELETE' });
      setCartCount(data.count);
      setItems((prev) => prev.filter((item) => item._id !== packageId));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to remove' };
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await apiFetch('/api/cart', { method: 'DELETE' });
      setItems([]);
      setCartCount(0);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to clear cart' };
    }
  }, []);

  const isInCart = useCallback((packageId) => {
    return items.some((item) => item._id === packageId);
  }, [items]);

  return (
    <CartContext.Provider value={{ items, cartCount, loading, addToCart, removeFromCart, clearCart, isInCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}
