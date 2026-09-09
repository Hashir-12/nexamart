import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { getProducts, getCategories } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import { Button } from '../components/common/Button';

const HomePage: React.FC = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const products = await getProducts();
      setFeatured(products.slice(0, 4));
      setTrending(products.slice(4, 8));
      const cats = await getCategories();
      setCategories(cats);
    };
    fetchData();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 px-4 rounded-2xl my-6 mx-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Amazing Deals</h1>
          <p className="text-xl mb-8">Shop smarter with AI‑powered recommendations.</p>
          <Link to="/products">
            <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Shopping
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${cat}`}
              className="bg-gray-100 hover:bg-gray-200 rounded-xl p-6 text-center transition"
            >
              <span className="text-lg font-medium">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4">Trending Now</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* AI Co‑Shopper CTA */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-blue-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Need help deciding?</h3>
          <p className="text-gray-600 mb-4">Ask our AI Co‑Shopper for personalized recommendations.</p>
          <Button variant="primary" size="lg" onClick={() => document.querySelector('[aria-label="Open AI Co‑Shopper"]')?.click()}>
            🤖 Chat with AI
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;