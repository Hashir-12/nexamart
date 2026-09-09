import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategories } from '../../services/productService';

export const ProductFilter: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const currentCategory = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = (cat: string) => {
    if (cat === currentCategory) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    if (value) {
      searchParams.set(type === 'min' ? 'minPrice' : 'maxPrice', value);
    } else {
      searchParams.delete(type === 'min' ? 'minPrice' : 'maxPrice');
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const applyFilters = () => {
    // Just trigger a re‑render – the URL already has the params
    setSearchParams(searchParams);
  };

  if (loading) {
    return <div className="text-gray-500">Loading categories...</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="font-semibold text-lg mb-4">Categories</h3>
      <div className="space-y-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`block w-full text-left px-2 py-1 rounded transition ${
              currentCategory === cat
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <h3 className="font-semibold text-lg mb-2">Price Range</h3>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          value={minPrice}
          onChange={(e) => handlePriceChange('min', e.target.value)}
          className="w-1/2 px-2 py-1 border rounded text-sm"
        />
        <span className="text-gray-400">—</span>
        <input
          type="number"
          placeholder="Max"
          value={maxPrice}
          onChange={(e) => handlePriceChange('max', e.target.value)}
          className="w-1/2 px-2 py-1 border rounded text-sm"
        />
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={applyFilters}
          className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
        >
          Apply
        </button>
        <button
          onClick={clearFilters}
          className="bg-gray-200 text-gray-700 px-4 py-1 rounded text-sm hover:bg-gray-300"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
};