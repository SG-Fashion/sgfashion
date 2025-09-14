import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";

// If using placeholder from /src/assets instead of public folder:
// import placeholder from '../assets/placeholder.png';

export default function Orders() {
  const { backendUrl, token, currency, products } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!token) return;
    axios
      .post(
        `${backendUrl}/api/order/userorders`,
        { userId: null },
        { headers: { token } }
      )
      .then(({ data }) => data.success && setOrders(data.orders.reverse()))
      .catch(console.error);
  }, [token]);

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancellingId(orderId);
    try {
      const res = await axios.patch(
        `${backendUrl}/api/order/cancel/${orderId}`,
        {},
        { headers: { token } }
      );
      if (res.data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, status: "Cancelled" } : order
          )
        );
      } else {
        alert(res.data.message || "Could not cancel the order.");
      }
    } catch (err) {
      console.error(err);
      alert("Error cancelling order.");
    } finally {
      setCancellingId(null);
    }
  };

  if (!orders.length) {
    return (
      <div className="px-4 border-t pt-16">
        <Title text1="MY" text2="ORDERS" />
        <p className="text-center text-gray-500 mt-5">No orders found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 border-t pt-16 space-y-6">
      <Title text1="MY" text2="ORDERS" />

      {orders.map((order) => (
        <div key={order._id} className="border p-4 sm:p-6 rounded-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 flex-wrap gap-y-2">
            <div>
              <p className="text-sm font-semibold break-all">
                Order #{order._id}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(order.date).toDateString()}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
              {order.status}
            </span>
          </div>

          {/* Items */}
          <div className="space-y-4">
            {order.items.map((item) => {
              const prod = products.find((p) => p._id === item.product) || {};
              return (
                <div
                  key={item.product + item.size}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <div className="w-20">
                    <img
                      src={prod.image?.[0] || "/placeholder.png"} // OR: || placeholder (if imported)
                      alt={prod.name || "Unknown Product"}
                      className="w-full h-auto object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">
                      {prod.name || "Unknown Product"}
                    </p>
                    <p className="text-gray-600 text-sm">
                      ₹{item.price} × {item.quantity}{" "}
                      <span className="text-xs">({item.size})</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t gap-4 flex-wrap">
            <p className="font-semibold text-sm sm:text-base">
              Total: ₹{order.amount.toFixed(2)}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Link
                to={`/track/${order._id}`}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-100 text-center"
              >
                Track Order
              </Link>

              {["Order Placed", "Processing"].includes(order.status) && (
                <button
                  onClick={() => cancelOrder(order._id)}
                  className="px-4 py-2 border rounded text-sm text-red-600 hover:bg-red-50"
                  disabled={cancellingId === order._id}
                >
                  {cancellingId === order._id
                    ? "Cancelling..."
                    : "Cancel Order"}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
