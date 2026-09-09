import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';

interface HeaderProps {
  onChatToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onChatToggle }) => {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="text-2xl font-bold text-blue-600">NexaMart</Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        <nav className="flex items-center gap-6">
          <Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link>
          <Link to="/orders" className="text-gray-700 hover:text-blue-600">Orders</Link>
          <Link to="/cart" className="text-gray-700 hover:text-blue-600 relative">
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            onClick={onChatToggle}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            aria-label="Open AI Co-Shopper"
          >
            AI Co-Shopper
          </button>
        </nav>
      </div>
    </header>
  );
};