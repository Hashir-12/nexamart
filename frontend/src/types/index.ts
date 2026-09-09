export type Product = {
  id: string;
  sku: string;
  title: string;
  slug: string;
  brand: string;
  category: string;
  subcategory?: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  features: string[];
  specifications: Record<string, string>;
  variants?: {
    name: string;
    options: string[];
  }[];
  colors?: string[];
  sizes?: string[];
  rating: number;
  reviewCount: number;
  stockStatus: 'In Stock' | 'Out of Stock' | 'Low Stock';
  tags: string[];
  useCases: string[];
  pros: string[];
  cons: string[];
};

export type CartItem = {
  product: Product;
  quantity: number;
  selectedVariant?: Record<string, string>;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  productCards?: Product[];
  comparisonTable?: {
    headers: string[];
    rows: (string | number)[][];
  };
  timestamp: Date;
};