import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrder, Order } from '../services/orderService';

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID missing');
        setLoading(false);
        return;
      }
      try {
        const data = await getOrder(orderId);
        // Ensure each item has a subtotal
        if (data && data.items) {
          data.items = data.items.map(item => ({
            ...item,
            subtotal: item.subtotal ?? item.price * item.quantity,
          }));
        }
        setOrder(data);
      } catch (err: any) {
        console.error('Failed to fetch order', err);
        setError(err.message || 'Order not found');
        // If order not found, navigate back after a delay
        setTimeout(() => navigate('/orders'), 2000);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, navigate]);

  if (loading) return <div className="text-center py-12">Loading order...</div>;
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <p className="mt-4">Redirecting back to orders...</p>
        <Link to="/orders" className="text-blue-600 hover:underline">Click here if not redirected</Link>
      </div>
    );
  }
  if (!order) return <div className="text-center py-12">Order not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Order #{order.id}</h1>
        <Link to="/orders" className="text-blue-600 hover:underline">← Back to orders</Link>
      </div>
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">{order.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">{new Date(order.date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-medium">${order.total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Delivery Status</p>
            <p className="font-medium">{order.delivery?.status || 'N/A'}</p>
          </div>
          {order.delivery?.estimated_delivery && (
            <div>
              <p className="text-sm text-gray-500">Estimated Delivery</p>
              <p className="font-medium">{new Date(order.delivery.estimated_delivery).toLocaleDateString()}</p>
            </div>
          )}
          {order.delivery?.tracking_number && (
            <div>
              <p className="text-sm text-gray-500">Tracking Number</p>
              <p className="font-medium">{order.delivery.tracking_number}</p>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Items</h3>
          <div className="border rounded divide-y">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.selections && Object.keys(item.selections).length > 0 && (
                    <p className="text-sm text-gray-500">
                      Options: {Object.entries(item.selections).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">${(item.subtotal ?? item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;