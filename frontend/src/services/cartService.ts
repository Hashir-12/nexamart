import { getSessionId } from '../utils/session';
import { Order } from './orderService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface CartItem {
  cart_item_id: string;
  product_id: string;
  title: string;
  quantity: number;
  price: number;
  subtotal: number;
  selections: Record<string, string>;
}

export interface CartSummary {
  items: CartItem[];
  total_items: number;
  total_quantity: number;
  total_price: number;
}

export async function getCart(): Promise<CartSummary> {
  const res = await fetch(`${API_BASE}/api/cart`, {
    headers: {
      'X-Session-ID': getSessionId()
    }
  });
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

export async function addToCart(productId: string, quantity: number = 1, selections?: Record<string, string>): Promise<CartSummary> {
  const res = await fetch(`${API_BASE}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': getSessionId()
    },
    body: JSON.stringify({ product_id: productId, quantity, selections })
  });
  if (!res.ok) throw new Error('Failed to add item');
  return res.json();
}

export async function removeFromCart(cartItemId: string): Promise<CartSummary> {
  const res = await fetch(`${API_BASE}/api/cart/items/${cartItemId}`, {
    method: 'DELETE',
    headers: {
      'X-Session-ID': getSessionId()
    }
  });
  if (!res.ok) throw new Error('Failed to remove item');
  return res.json();
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<CartSummary> {
  const res = await fetch(`${API_BASE}/api/cart/items/${cartItemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': getSessionId()
    },
    body: JSON.stringify({ quantity })
  });
  if (!res.ok) throw new Error('Failed to update quantity');
  return res.json();
}

export async function updateCartItemSelections(cartItemId: string, selections: Record<string, string>): Promise<CartSummary> {
  const res = await fetch(`${API_BASE}/api/cart/items/${cartItemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': getSessionId()
    },
    body: JSON.stringify({ selections })
  });
  if (!res.ok) throw new Error('Failed to update selections');
  return res.json();
}

export async function clearCart(): Promise<CartSummary> {
  const res = await fetch(`${API_BASE}/api/cart`, {
    method: 'DELETE',
    headers: {
      'X-Session-ID': getSessionId()
    }
  });
  if (!res.ok) throw new Error('Failed to clear cart');
  return { items: [], total_items: 0, total_quantity: 0, total_price: 0 };
}

export async function checkout(): Promise<Order> {
  const res = await fetch(`${API_BASE}/api/checkout`, {
    method: 'POST',
    headers: {
      'X-Session-ID': getSessionId()
    }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Checkout failed');
  }
  return res.json();
}