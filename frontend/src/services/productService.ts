import { Product } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/api/products`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const response = await fetch(`${API_BASE}/api/products/slug/${slug}`);
  if (response.status === 404) {
    return undefined;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  return response.json();
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/api/products?category=${encodeURIComponent(category)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products by category');
  }
  return response.json();
}

export async function searchProducts(query: string): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/api/products?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search products');
  }
  return response.json();
}

export async function getCategories(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}