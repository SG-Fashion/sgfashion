import React, { useContext, useState, useEffect, useMemo } from 'react';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { State } from 'country-state-city';

const PlaceOrder = () => {
  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    products
  } = useContext(ShopContext);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [saveAddressChecked, setSaveAddressChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  // --- Coupon states ---
  const [couponCode, setCouponCode] = useState('');
  const [couponInfo, setCouponInfo] = useState(null); // { coupon, discountAmount, freebie }
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const indianStates = useMemo(() => State.getStatesOfCountry('IN'), []);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: 'India',
    phoneCode: '+91',
    phone: ''
  });

  // Fetch saved addresses
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${backendUrl}/api/user/saved-addresses`, { headers: { token } })
      .then(res => res.data.success && setSavedAddresses(res.data.savedAddresses))
      .catch(() => toast.error('Failed to load saved addresses.'));
  }, [backendUrl, token]);

  const onChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const selectSavedAddress = i => {
    const addr = savedAddresses[i];
    setFormData({ ...addr, country: 'India', phoneCode: '+91' });
    setUseSavedAddress(true);
  };

  const useNewAddress = () => {
    setUseSavedAddress(false);
    setSaveAddressChecked(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zipcode: '',
      country: 'India',
      phoneCode: '+91',
      phone: ''
    });
  };

  const buildOrderItems = () =>
    Object.entries(cartItems)
      .flatMap(([pid, sizes]) =>
        Object.entries(sizes).map(([size, qty]) => {
          const p = products.find(x => x._id === pid);
          return p && qty > 0
            ? { product: pid, name: p.name, size, quantity: qty, price: p.price }
            : null;
        })
      )
      .filter(Boolean);

  // ---- Coupon handlers ----
  const applyCoupon = async () => {
    const code = (couponCode || '').trim();
    if (!code) return toast.error('Enter coupon code');

    setApplyingCoupon(true);
    try {
      const totalBefore = getCartAmount() + (delivery_fee || 0);
      const res = await axios.post(
        `${backendUrl}/api/coupons/validate`,
        { code, totalAmount: totalBefore },
        { headers: { token } }
      );

      if (res.data && res.data.success) {
        setCouponInfo({
          coupon: res.data.coupon,
          discountAmount: res.data.discountAmount || 0,
          freebie: res.data.freebie || null
        });
        toast.success('Coupon applied!');
      } else {
        setCouponInfo(null);
        toast.error(res.data?.message || 'Invalid coupon');
      }
    } catch (err) {
      setCouponInfo(null);
      toast.error(err.response?.data?.message || 'Coupon validation failed');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponInfo(null);
    toast.info('Coupon removed');
  };

  // ---- Place order ----
  const handlePlaceOrder = async () => {
    if (!token) return toast.error('Please login.');
    const items = buildOrderItems();
    if (!items.length) return toast.error('Cart is empty.');
    setLoading(true);

    // optionally save address
    if (!useSavedAddress && saveAddressChecked) {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/user/save-address`,
          { address: formData },
          { headers: { token } }
        );
        data.success && toast.success('Address saved!');
      } catch {
        toast.error('Failed to save address.');
      }
    }

    const originalAmount = getCartAmount() + (delivery_fee || 0);

    const payload = {
      userId: null,
      items,
      amount: originalAmount,
      address: formData,
      couponCode: couponInfo?.coupon?.code || couponCode.trim().toUpperCase()
    };

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/order/razorpay`,
        payload,
        { headers: { token } }
      );
      if (data.success) {
        initPay(data.order);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  const initPay = order => {
    if (!window.Razorpay) {
      return toast.error('Razorpay SDK failed to load.');
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: 'INR',
      order_id: order.id,
      name: 'STOFFS Fashion',
      description: 'Order Payment',
      prefill: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        contact: formData.phone
      },
      theme: { color: '#000000' },
      handler: async resp => {
        try {
          const { data } = await axios.post(
            `${backendUrl}/api/order/verifyRazorpay`,
            {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature
            },
            { headers: { token } }
          );
          if (data.success) {
            toast.success('Payment successful!');
            setCartItems({});
            localStorage.removeItem('cartItems');
            navigate('/orders');
          } else {
            toast.error('Verification failed!');
          }
        } catch {
          toast.error('Verification error!');
        }
      },
      modal: {
        ondismiss: async () => {
          await axios.post(
            `${backendUrl}/api/order/delete-pending`,
            { orderId: order.receipt },
            { headers: { token } }
          );
        }
      }
    };

    new window.Razorpay(options).open();
  };

  // --- Totals with discount preview ---
  const totalBefore = getCartAmount() + (delivery_fee || 0);
  const discountShown = couponInfo?.discountAmount || 0;
  const finalShown = Math.max(0, totalBefore - discountShown);

  return (
    <form
      onSubmit={e => e.preventDefault()}
      className="ml-4 pr-4 sm:ml-10 flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t"
    >
      {/* LEFT COLUMN */}
      <div className="flex flex-col gap-6 w-full sm:w-2/3">
        <Title text1="DELIVERY" text2="INFORMATION" />

        {/* saved addresses */}
        <div>
          <h3 className="text-lg font-semibold">Saved Addresses</h3>
          {savedAddresses.length === 0 ? (
            <p className="italic text-gray-500">No saved addresses</p>
          ) : (
            savedAddresses.map((addr, i) => (
              <div
                key={`${addr._id ?? 'addr'}-${i}`}
                className="border p-2 mb-2"
              >
                <label className="flex items-center">
                  <input
                    type="radio"
                    className="mr-2"
                    checked={
                      useSavedAddress &&
                      formData.street === addr.street &&
                      formData.zipcode === addr.zipcode
                    }
                    onChange={() => selectSavedAddress(i)}
                  />
                  <span className="font-bold">
                    {addr.firstName} {addr.lastName}
                  </span>
                </label>
                <p>
                  {addr.street}, {addr.city}, {addr.state}, {addr.zipcode}
                </p>
              </div>
            ))
          )}
          {useSavedAddress && (
            <button
              type="button"
              onClick={useNewAddress}
              className="text-blue-500"
            >
              Use a new address
            </button>
          )}
        </div>

        {/* new address form */}
        {!useSavedAddress && (
          <>
            <div className="flex gap-3">
              <input
                required
                name="firstName"
                onChange={onChange}
                value={formData.firstName}
                placeholder="First name"
                className="border rounded py-1.5 px-4 w-full"
              />
              <input
                required
                name="lastName"
                onChange={onChange}
                value={formData.lastName}
                placeholder="Last name"
                className="border rounded py-1.5 px-4 w-full"
              />
            </div>
            <input
              required
              name="email"
              type="email"
              onChange={onChange}
              value={formData.email}
              placeholder="Email address"
              className="border rounded py-1.5 px-4 w-full"
            />
            <input
              required
              name="street"
              onChange={onChange}
              value={formData.street}
              placeholder="Street"
              className="border rounded py-1.5 px-4 w-full"
            />
            <select
              disabled
              className="border rounded py-1.5 px-4 w-full bg-gray-100"
            >
              <option key="country-india">India</option>
            </select>
            <select
              required
              name="state"
              value={formData.state}
              onChange={e =>
                setFormData(f => ({ ...f, state: e.target.value, city: '' }))
              }
              className="border rounded py-1.5 px-4 w-full"
            >
              <option key="select-state" value="">
                Select State
              </option>
              {indianStates.map(s => (
                <option key={s.isoCode} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              required
              name="city"
              onChange={onChange}
              value={formData.city}
              placeholder="City"
              className="border rounded py-1.5 px-4 w-full"
            />
            <input
              required
              name="zipcode"
              onChange={onChange}
              value={formData.zipcode}
              placeholder="Zip Code"
              className="border rounded py-1.5 px-4 w-full"
            />
            <div className="flex">
              <input
                readOnly
                value={formData.phoneCode}
                className="border rounded-l py-1.5 px-4 w-20 bg-gray-100"
              />
              <input
                required
                name="phone"
                onChange={onChange}
                value={formData.phone}
                placeholder="Phone Number"
                className="border-t border-b border-r rounded-r py-1.5 px-4 flex-1"
              />
            </div>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={saveAddressChecked}
                onChange={() => setSaveAddressChecked(x => !x)}
                className="mr-2"
              />
              <label className="text-sm">Save this address</label>
            </div>
          </>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full sm:w-1/3 px-4">
        <CartTotal />

        {/* Coupon UI */}
        <div className="mt-4 mb-4">
          <div className="flex gap-2 justify-end items-center">
            <input
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              placeholder="Coupon code"
              className="border rounded px-3 py-2 w-40"
              disabled={applyingCoupon || loading}
            />
            {!couponInfo ? (
              <button
                type="button"
                onClick={applyCoupon}
                className="bg-gray-800 text-white px-3 py-2 rounded"
                disabled={applyingCoupon || loading}
              >
                {applyingCoupon ? 'Checking...' : 'Apply'}
              </button>
            ) : (
              <button
                type="button"
                onClick={removeCoupon}
                className="bg-red-600 text-white px-3 py-2 rounded"
                disabled={loading}
              >
                Remove
              </button>
            )}
          </div>

          <div className="text-right mt-2 text-sm text-gray-700">
            <div>Total: ₹{totalBefore.toFixed(2)}</div>
            {discountShown > 0 && <div>Discount: -₹{discountShown.toFixed(2)}</div>}
            {couponInfo?.freebie && <div>Freebie: {couponInfo.freebie.name}</div>}
            <div className="font-semibold mt-1">Payable: ₹{finalShown.toFixed(2)}</div>
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-black text-white py-3 mt-8 text-sm disabled:opacity-50"
        >
          {loading
            ? 'Processing...'
            : paymentMethod === 'cod'
            ? 'PLACE ORDER (COD)'
            : 'PAY WITH RAZORPAY'}
        </button>
      </div>
    </form>
  );
};

export default PlaceOrder;
