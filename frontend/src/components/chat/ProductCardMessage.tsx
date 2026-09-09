import React from 'react';
import { Product } from '../../types';

interface ProductCardMessageProps {
  product: Product;
}

const ProductCardMessage: React.FC<ProductCardMessageProps> = ({ product }) => {
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '';
  const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23e2e8f0"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="12" fill="%2364748b" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = fallbackImage;
  };

  return (
    <div className="border rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 flex gap-3 items-start max-w-full">
      <img
        src={imageUrl || fallbackImage}
        alt={product.title}
        className="w-24 h-24 object-cover rounded-lg bg-gray-100 flex-shrink-0"
        onError={handleImageError}
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-800 text-sm truncate">{product.title}</h4>
        <p className="text-xs text-gray-500 truncate">{product.brand || 'NexaMart'}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-lg font-bold text-blue-600">${product.price}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm line-through text-gray-400">${product.compareAtPrice}</span>
          )}
        </div>
        {product.rating && (
          <div className="flex items-center gap-1 text-xs mt-1">
            <span className="text-yellow-500">★</span>
            <span className="font-medium">{product.rating}</span>
            {product.reviewCount && (
              <span className="text-gray-400">({product.reviewCount} reviews)</span>
            )}
          </div>
        )}
        <button className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full transition-colors duration-150">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCardMessage;