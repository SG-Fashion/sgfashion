import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const Users = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all"); // all | empty | filled

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/admin/users`, {
          headers: { token },
        });
        if (res.data.success) {
          setUsers(res.data.users);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, [token]);

  // Apply filter
  const filteredUsers = users.filter((u) => {
    let hasItems = false;

    if (u.cartData && typeof u.cartData === "object") {
      hasItems = Object.keys(u.cartData).length > 0;
    }

    if (filter === "empty") return !hasItems;
    if (filter === "filled") return hasItems;
    return true;
  });

  // Render cart safely
  const renderCart = (cartData) => {
    if (!cartData || typeof cartData !== "object" || Object.keys(cartData).length === 0) {
      return "Empty";
    }

    return (
      <ul className="list-disc list-inside text-sm">
        {Object.entries(cartData).map(([productId, qty]) => (
          <li key={String(productId)}>
            {String(productId)} × {String(qty)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">All Users</h2>

      {/* Filter buttons */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded ${
            filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("empty")}
          className={`px-4 py-2 rounded ${
            filter === "empty" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Empty Cart
        </button>
        <button
          onClick={() => setFilter("filled")}
          className={`px-4 py-2 rounded ${
            filter === "filled" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Has Items
        </button>
      </div>

      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Cart Items</th>
            <th className="border px-4 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u._id}>
              <td className="border px-4 py-2">{u.name}</td>
              <td className="border px-4 py-2">{u.email}</td>
              <td className="border px-4 py-2">{renderCart(u.cartData)}</td>
              <td className="border px-4 py-2">
                {new Date(u.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
