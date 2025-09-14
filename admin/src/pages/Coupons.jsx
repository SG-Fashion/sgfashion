// admin/src/pages/Coupons.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const defaultForm = {
  code: "",
  type: "discount", // discount | freebie
  discountType: "percent", // percent | fixed
  discountValue: 0,
  freebieProductId: "",
  minPurchase: 0,
  expiryDate: "", // yyyy-mm-dd
  isActive: true,
};

export default function Coupons({ token }) {
  const [form, setForm] = useState(defaultForm);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [products, setProducts] = useState([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const parseArrayResponse = (data, keyCandidates = []) => {
    if (Array.isArray(data)) return data;
    for (const key of keyCandidates) {
      if (Array.isArray(data?.[key])) return data[key];
    }
    return [];
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/coupons`, {
        headers: { token },
      });
      setCoupons(parseArrayResponse(res.data, ["coupons"]));
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch coupons.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setFetchingProducts(true);
    try {
      const endpoints = [
        `${backendUrl}/api/products`,
        `${backendUrl}/api/product`,
        `${backendUrl}/api/product/list`,
      ];
      let found = [];
      for (const url of endpoints) {
        try {
          const res = await axios.get(url, { headers: { token } });
          found = parseArrayResponse(res.data, ["products", "productsList"]);
          if (found.length) break;
        } catch {
          // try next
        }
      }
      if (found.length) {
        setProducts(found);
        toast.success(`Loaded ${found.length} products`);
      } else {
        toast.info("No products found. Enter product ID manually.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch products.");
    } finally {
      setFetchingProducts(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreate = async () => {
    if (!form.code.trim()) return toast.error("Code is required");
    if (form.type === "discount" && (!form.discountValue || form.discountValue <= 0)) {
      return toast.error("Discount value must be greater than 0");
    }
    if (form.type === "freebie" && !form.freebieProductId) {
      return toast.error("Freebie Product ID is required");
    }
    if (!form.expiryDate) return toast.error("Expiry date required");

    setCreating(true);
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        expiryDate: new Date(form.expiryDate).toISOString(),
      };
      const res = await axios.post(`${backendUrl}/api/coupons`, payload, {
        headers: { token },
      });
      if (res.data?.success) {
        toast.success("Coupon created");
        setForm(defaultForm);
        fetchCoupons();
      } else {
        toast.error(res.data?.message || "Create failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Coupons</h2>

      {/* Create Coupon Form */}
      <div className="bg-white p-4 rounded shadow-sm mb-6">
        <h3 className="font-medium mb-2">Create Coupon</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder="Code (e.g. SAVE10)"
            className="border rounded px-3 py-2"
            disabled={creating}
          />

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border rounded px-3 py-2"
            disabled={creating}
          >
            <option value="discount">Discount</option>
            <option value="freebie">Freebie</option>
          </select>

          {form.type === "discount" && (
            <>
              <select
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
                className="border rounded px-3 py-2"
                disabled={creating}
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>

              <input
                name="discountValue"
                value={form.discountValue}
                onChange={handleChange}
                type="number"
                placeholder="Discount value"
                className="border rounded px-3 py-2"
                min={0}
                disabled={creating}
              />
            </>
          )}

          {form.type === "freebie" && (
            <>
              <div className="flex items-center gap-2">
                <input
                  name="freebieProductId"
                  value={form.freebieProductId}
                  onChange={handleChange}
                  placeholder="Freebie Product ID"
                  className="border rounded px-3 py-2 flex-1"
                  disabled={creating}
                />
                <button
                  type="button"
                  onClick={fetchProducts}
                  className="bg-gray-800 text-white px-3 py-2 rounded"
                  disabled={fetchingProducts || creating}
                >
                  {fetchingProducts ? "Loading..." : "Load Products"}
                </button>
              </div>

              {products.length > 0 && (
                <select
                  onChange={(e) => setForm((p) => ({ ...p, freebieProductId: e.target.value }))}
                  value={form.freebieProductId}
                  className="border rounded px-3 py-2"
                  disabled={creating}
                >
                  <option value="">Select freebie product</option>
                  {products.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} {p.price ? `- ₹${p.price}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          <input
            name="minPurchase"
            value={form.minPurchase}
            onChange={handleChange}
            type="number"
            placeholder="Minimum purchase (₹)"
            className="border rounded px-3 py-2"
            min={0}
            disabled={creating}
          />

          <input
            name="expiryDate"
            value={form.expiryDate}
            onChange={handleChange}
            type="date"
            className="border rounded px-3 py-2"
            disabled={creating}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              disabled={creating}
            />
            <span>Active</span>
          </label>
        </div>

        <div className="mt-3">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {creating ? "Creating..." : "Create Coupon"}
          </button>
        </div>
      </div>

      {/* Existing Coupons */}
      <div className="bg-white p-4 rounded shadow-sm">
        <h3 className="font-medium mb-3">Existing Coupons</h3>
        {loading ? (
          <div>Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="text-sm text-gray-500">No coupons found</div>
        ) : (
          <div className="space-y-3">
            {coupons.map((c) => (
              <div key={c._id || c.code} className="border rounded p-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    {c.code}{" "}
                    {c.isActive ? (
                      <span className="text-green-600 text-sm font-medium ml-2">(Active)</span>
                    ) : (
                      <span className="text-red-600 text-sm font-medium ml-2">(Inactive)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {c.type === "discount"
                      ? `${c.discountType === "percent" ? `${c.discountValue}% off` : `₹${c.discountValue} off`}`
                      : `Freebie: ${c.freebieProductId || "N/A"}`}
                    {c.minPurchase ? ` • Min ₹${c.minPurchase}` : ""} • Expires:{" "}
                    {new Date(c.expiryDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1 border rounded text-sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(c.code);
                      toast.success("Coupon code copied");
                    }}
                  >
                    Copy
                  </button>
                  <button
                    className="px-3 py-1 border rounded text-sm"
                    onClick={fetchCoupons}
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
