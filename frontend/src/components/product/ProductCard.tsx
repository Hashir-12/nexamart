import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { Rating } from '../common/Rating';
import { Button } from '../common/Button';
import { useCart } from '../../hooks/useCart';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
      <Link to={`/product/${product.slug}`}>
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
        />
      </Link>
      <div className="p-4">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-semibold text-lg text-gray-800 hover:text-blue-600 truncate">{product.title}</h3>
        </Link>
        <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">${product.compareAtPrice.toFixed(2)}</span>
            )}
          </div>
          <Rating value={product.rating} size="sm" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-xs ${product.stockStatus === 'In Stock' ? 'text-green-600' : 'text-red-600'}`}>
            {product.stockStatus}
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => addItem(product)}
            className="text-xs"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;