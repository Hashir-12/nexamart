import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Product } from '../types';
import { getProductBySlug } from '../services/productService';
import { Rating } from '../components/common/Rating';
import { Button } from '../components/common/Button';
import { useCart } from '../hooks/useCart';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const { addItem } = useCart();

  useEffect(() => {
    const fetch = async () => {
      if (slug) {
        const p = await getProductBySlug(slug);
        setProduct(p || null);
        setLoading(false);
        if (p) {
          const initial: Record<string, string> = {};
          if (p.colors && p.colors.length > 0) initial.color = p.colors[0];
          if (p.sizes && p.sizes.length > 0) initial.size = p.sizes[0];
          if (p.storage && p.storage.length > 0) initial.storage = p.storage[0];
          if (p.ram && p.ram.length > 0) initial.ram = p.ram[0];
          setSelections(initial);
        }
      }
    };
    fetch();
  }, [slug]);

  const handleSelectionChange = (key: string, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!product) return <div className="text-center py-12">Product not found.</div>;

  const optionKeys = ['colors', 'sizes', 'storage', 'ram'];
  const availableOptions = optionKeys.filter(key => product[key as keyof Product] && Array.isArray(product[key as keyof Product]) && (product[key as keyof Product] as any[]).length > 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={product.images[selectedImage]}
            alt={product.title}
            className="w-full h-96 object-cover rounded-lg"
          />
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-20 h-20 border-2 rounded ${
                  i === selectedImage ? 'border-blue-600' : 'border-gray-200'
                }`}
              >
                <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold">{product.title}</h1>
          <p className="text-gray-600 text-lg">{product.brand}</p>
          <div className="flex items-center gap-4 mt-2">
            <Rating value={product.rating} size="lg" />
            <span className="text-gray-500">({product.reviewCount} reviews)</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
            {product.compareAtPrice && (
              <span className="text-lg text-gray-400 line-through ml-3">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          <p className="mt-4 text-gray-700">{product.description}</p>

          {availableOptions.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold">Select Options</h3>
              {availableOptions.map((key) => {
                const values = product[key as keyof Product] as string[];
                const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700">{displayKey}</label>
                    <select
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selections[key] || ''}
                      onChange={(e) => handleSelectionChange(key, e.target.value)}
                    >
                      {values.map((val) => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Button variant="primary" size="lg" onClick={() => addItem(product, 1, selections)}>
              Add to Cart
            </Button>
            <Button variant="outline" size="lg">Buy Now</Button>
          </div>

          <div className="mt-4 text-sm text-green-600">{product.stockStatus}</div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;