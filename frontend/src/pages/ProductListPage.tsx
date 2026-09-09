import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types';
import { getProducts } from '../services/productService';
import ProductGrid from '../components/product/ProductGrid'; // default export – OK
import { ProductFilter } from '../components/product/ProductFilter'; // named export
import { ProductSort } from '../components/product/ProductSort'; // named export

const ProductListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [sort, setSort] = useState<'price_asc' | 'price_desc' | 'rating'>('rating');

  useEffect(() => {
    const fetch = async () => {
      const all = await getProducts();
      setProducts(all);
    };
    fetch();
  }, []);

  useEffect(() => {
    let result = products;
    if (category) {
      result = result.filter((p) => p.category === category);
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    // Apply sort
    if (sort === 'price_asc') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') result.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
    setFiltered(result);
  }, [products, category, query, sort]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-1/4">
          <ProductFilter />
        </aside>
        <main className="md:w-3/4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">
              {category || query ? `${category || query} Products` : 'All Products'}
            </h1>
            <ProductSort value={sort} onChange={setSort} />
          </div>
          <ProductGrid products={filtered} />
        </main>
      </div>
    </div>
  );
};

export default ProductListPage;