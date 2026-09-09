import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { CartItem } from '../components/cart/CartItem';
import { CartSummary } from '../components/cart/CartSummary';
import { Button } from '../components/common/Button';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, subtotal, totalItems, loading, checkout } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const order = await checkout();
      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      alert('Checkout failed: ' + err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading your cart...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Browse our products and add items you like.</p>
        <Link to="/products">
          <Button variant="primary">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {items.map((item) => (
            <CartItem
              key={item.cart_item_id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>
        <div>
          <CartSummary
            subtotal={subtotal}
            itemCount={totalItems}
            onCheckout={handleCheckout}
            isCheckingOut={checkingOut}
          />
        </div>
      </div>
    </div>
  );
};

export default CartPage;