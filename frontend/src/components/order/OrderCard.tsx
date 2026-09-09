import React from 'react';
import { Link } from 'react-router-dom';
import { Order } from '../../services/orderService';

interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  return (
    <Link to={`/orders/${order.id}`} className="block border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Order #{order.id}</h3>
          <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
          <p className="text-sm">Status: <span className="font-medium">{order.status}</span></p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
          <p className="text-sm text-gray-500">{order.items.length} item(s)</p>
        </div>
      </div>
    </Link>
  );
};