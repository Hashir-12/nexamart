import React from 'react';
import { CartItem as CartItemType } from '../../services/cartService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onRemove: (cartItemId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
      onUpdateQuantity(item.cart_item_id, val);
    }
  };

  const hasSelections = item.selections && Object.keys(item.selections).length > 0;
  const selectionDisplay = hasSelections
    ? Object.entries(item.selections).map(([key, value]) => `${key}: ${value}`).join(', ')
    : null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-gray-200 py-4">
      <div className="flex-1">
        <h3 className="font-semibold text-lg">{item.title}</h3>
        {hasSelections && (
          <p className="text-sm text-gray-500">Options: {selectionDisplay}</p>
        )}
        <p className="text-sm text-gray-500">Price: ${item.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="1"
          value={item.quantity}
          onChange={handleQuantityChange}
          className="w-16 text-center"
        />
        <Button variant="outline" size="sm" onClick={() => onRemove(item.cart_item_id)}>
          Remove
        </Button>
      </div>
      <div className="text-right font-medium">
        ${item.subtotal.toFixed(2)}
      </div>
    </div>
  );
};