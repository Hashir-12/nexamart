import { useState, useEffect, useCallback } from 'react';
import { CartSummary, getCart, addToCart, removeFromCart, updateCartItemQuantity, updateCartItemSelections, clearCart, checkout } from '../services/cartService';
import { Product } from '../types';

export const useCart = () => {
  const [cart, setCart] = useState<CartSummary>({ items: [], total_items: 0, total_quantity: 0, total_price: 0 });
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCart();
      setCart(data);
    } catch (err) {
      console.error('Failed to refresh cart', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(async (product: Product, quantity: number = 1, selections?: Record<string, string>) => {
    try {
      const updated = await addToCart(product.id, quantity, selections);
      setCart(updated);
    } catch (err) {
      console.error('Failed to add item', err);
      throw err;
    }
  }, []);

  const removeItem = useCallback(async (cartItemId: string) => {
    try {
      const updated = await removeFromCart(cartItemId);
      setCart(updated);
    } catch (err) {
      console.error('Failed to remove item', err);
      throw err;
    }
  }, []);

  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    try {
      const updated = await updateCartItemQuantity(cartItemId, quantity);
      setCart(updated);
    } catch (err) {
      console.error('Failed to update quantity', err);
      throw err;
    }
  }, []);

  const updateSelections = useCallback(async (cartItemId: string, selections: Record<string, string>) => {
    try {
      const updated = await updateCartItemSelections(cartItemId, selections);
      setCart(updated);
    } catch (err) {
      console.error('Failed to update selections', err);
      throw err;
    }
  }, []);

  const clear = useCallback(async () => {
    try {
      const updated = await clearCart();
      setCart(updated);
    } catch (err) {
      console.error('Failed to clear cart', err);
      throw err;
    }
  }, []);

  const checkoutCart = useCallback(async () => {
    try {
      const order = await checkout();
      await refreshCart(); // cart is now empty
      return order;
    } catch (err) {
      console.error('Checkout failed', err);
      throw err;
    }
  }, [refreshCart]);

  return {
    items: cart.items,
    totalItems: cart.total_quantity,
    subtotal: cart.total_price,
    loading,
    refreshCart,
    addItem,
    removeItem,
    updateQuantity,
    updateSelections,
    clear,
    checkout: checkoutCart,
  };
};