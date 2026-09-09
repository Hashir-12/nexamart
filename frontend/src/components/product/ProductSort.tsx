import React from 'react';

interface ProductSortProps {
  value: 'price_asc' | 'price_desc' | 'rating';
  onChange: (value: 'price_asc' | 'price_desc' | 'rating') => void;
}

export const ProductSort: React.FC<ProductSortProps> = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as any)}
      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    >
      <option value="rating">Top Rated</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
};