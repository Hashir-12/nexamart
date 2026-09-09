import { getSessionId } from '../utils/session';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface OrderItem {
  product_id: string;
  title: string;
  quantity: number;
  price: number;
  subtotal: number;
  selections: Record<string, string>;
}

export interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: OrderItem[];
  delivery: {
    status: string;
    estimated_delivery: string;
    tracking_number: string | null;
    last_update: string;
  };
}

export async function getOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/api/orders`, {
    headers: {
      'X-Session-ID': getSessionId()
    }
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function getOrder(orderId: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
    headers: {
      'X-Session-ID': getSessionId()
    }
  });
  if (!res.ok) throw new Error('Failed to fetch order');
  return res.json();
}