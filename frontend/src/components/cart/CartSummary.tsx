import React from 'react';
import { Button } from '../common/Button';

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  onCheckout?: () => void;
  isCheckingOut?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({ subtotal, itemCount, onCheckout, isCheckingOut }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Items ({itemCount})</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>Calculated at checkout</span>
        </div>
      </div>
      <hr className="my-4" />
      <div className="flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      <Button
        variant="primary"
        className="w-full mt-4"
        onClick={onCheckout}
        disabled={isCheckingOut}
      >
        {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
      </Button>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Shipping and taxes calculated at checkout.
      </p>
    </div>
  );
};