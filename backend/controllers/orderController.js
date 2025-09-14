import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { sendOrderEmail, sendOrderSMS } from "../utils/notifications.js";
import Stripe from 'stripe';
import razorpay from 'razorpay';

function buildMessage(type, order, status) {
  const itemName = order.items.map(i => i.name).join(', ');
  const amount = order.amount;
  const base = `Your Order "${itemName}" of price ₹${amount}`;

  switch(type) {
    case 'placed':
      return `${base} has been placed successfully. Track it here: ${FRONTEND_TRACK_URL}/${order._id}`;
    case 'payment':
      return `${base} payment was successful. Track it here: ${FRONTEND_TRACK_URL}/${order._id}`;
    case 'status':
      return `${base} status has been updated to "${status}". Track it here: ${FRONTEND_TRACK_URL}/${order._id}`;
    case 'cancelled':
      return `${base} has been cancelled. Thank you for shopping with us.`;
    default:
      return base;
  }
}
// global variables
const currency = 'inr';
const deliveryCharge = 10;

// gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Placing orders using COD Method
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
    };

    const newOrder = await new orderModel(orderData).save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // send SMS notification
    sendOrderSMS(newOrder.address.phone, newOrder)
      .catch(err => console.error("SMS error:", err));

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Placing orders using Stripe Method
const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;
    const { origin } = req.headers;

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "Stripe",
      payment: false,
      date: Date.now(),
    };

    const newOrder = await new orderModel(orderData).save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // send initial SMS
    sendOrderSMS(newOrder.address.phone, newOrder)
      .catch(err => console.error("SMS error:", err));

    const line_items = items.map(item => ({
      price_data: {
        currency,
        product_data: { name: item.name },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency,
        product_data: { name: 'Delivery Charges' },
        unit_amount: deliveryCharge * 100,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: 'payment',
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Get one order by its ID (for the logged‐in user)
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify Stripe
const verifyStripe = async (req, res) => {
  const { orderId, success, userId } = req.body;

  try {
    if (success === "true") {
      const updated = await orderModel.findByIdAndUpdate(
        orderId,
        { payment: true },
        { new: true }
      );
      await userModel.findByIdAndUpdate(userId, { cartData: {} });

      // send SMS notification on payment success
      sendOrderSMS(updated.address.phone, updated)
        .catch(err => console.error("SMS error:", err));

      return res.json({ success: true });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      return res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Placing orders using Razorpay Method
const placeOrderRazorpay = async (req, res) => {
  try {
    const { userId, items, amount, address, couponCode } = req.body;

    // 1) Apply coupon server-side
    let amountAfter = amount;
    let discountAmount = 0;
    let coupon = null;
    let finalItems = items;

    try {
      if (couponCode) {
        const applied = await _applyCouponServerSide(couponCode, items, amount);
        amountAfter = applied.amountAfter;
        discountAmount = applied.discountAmount || 0;
        coupon = applied.coupon || null;
        finalItems = applied.items || items;
      }
    } catch (couponErr) {
      console.error("Coupon apply failed:", couponErr);
      return res.status(400).json({ 
        success: false, 
        message: couponErr.message || "Coupon validation failed" 
      });
    }

    // 2) Create DB order (pending payment)
    const orderData = {
      userId,
      items: finalItems,
      address,
      amount: amountAfter,               // amount after discount
      originalAmount: amount,            // before discount
      discountAmount,
      coupon: coupon ? { 
        code: coupon.code, 
        couponId: coupon._id, 
        type: coupon.type 
      } : null,
      paymentMethod: "Razorpay",
      payment: false,
      date: Date.now(),
    };

    const newOrder = await new orderModel(orderData).save();

    // 3) Send initial SMS notification
    sendOrderSMS(newOrder.address.phone, newOrder)
      .catch(err => console.error("SMS error:", err));

    // 4) Create Razorpay order
    const options = {
      amount: Math.round(amountAfter * 100), // paise
      currency: currency.toUpperCase(),
      receipt: newOrder._id.toString(),
    };

    razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.error("Razorpay order create error:", error);
        return res.json({ success: false, message: error });
      }
      res.json({ 
        success: true, 
        order, 
        newOrderId: newOrder._id, 
        amountAfter, 
        discountAmount, 
        couponPreview: orderData.coupon 
      });
    });

  } catch (error) {
    console.error("placeOrderRazorpay error:", error);
    res.json({ success: false, message: error.message });
  }
};


// Verify Razorpay
const verifyRazorpay = async (req, res) => {
  try {
    const { userId, razorpay_order_id } = req.body;

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
    if (orderInfo.status === 'paid') {
      await orderModel.findByIdAndUpdate(orderInfo.receipt, {
        payment: true,
        razorpayOrderId: razorpay_order_id,
      });

      await userModel.findByIdAndUpdate(userId, { cartData: {} });

      const paymentsList = await razorpayInstance.payments.all({ order_id: razorpay_order_id });
      const paymentId = paymentsList.items[0]?.id;
      if (paymentId) {
        await orderModel.findByIdAndUpdate(orderInfo.receipt, { razorpayPaymentId: paymentId });
      }

      const updatedOrder = await orderModel.findById(orderInfo.receipt);

      // send notifications (email & SMS)
      sendOrderEmail(updatedOrder.address.email, updatedOrder)
        .catch(err => console.error("Email error:", err));
      sendOrderSMS(updatedOrder.address.phone, updatedOrder)
        .catch(err => console.error("SMS error:", err));

      return res.json({ success: true, message: "Payment Successful" });
    }

    return res.json({ success: false, message: "Payment Failed" });
  } catch (error) {
    console.error("verifyRazorpay error:", error);
    return res.json({ success: false, message: error.message });
  }
};

// All Orders data for Admin Panel
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// User Order Data For Frontend
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// update order status from Admin Panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status, trackingUrl } = req.body;
    const updateData = { status };
    if (status === "Shipped" && typeof trackingUrl === "string" && trackingUrl.trim() !== "") {
      updateData.trackingUrl = trackingUrl.trim();
    }

    await orderModel.findByIdAndUpdate(orderId, updateData);
    const updatedOrder = await orderModel.findById(orderId);

    // send status‐update SMS
    sendOrderSMS(updatedOrder.address.phone, updatedOrder)
      .catch(err => console.error("SMS error:", err));

    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

import Coupon from "../models/couponModel.js";

async function _applyCouponServerSide(code, items, amount) {
  if (!code) return { amountAfter: amount, discountAmount: 0, coupon: null, items: items };

  const codeNorm = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: codeNorm, isActive: true });
  if (!coupon) throw new Error("Invalid coupon");
  if (coupon.expiryDate < new Date()) throw new Error("Coupon expired");
  if (amount < (coupon.minPurchase || 0)) throw new Error(`Minimum purchase ₹${coupon.minPurchase} required`);

  let discountAmount = 0;
  let updatedItems = [...items];

  if (coupon.type === "discount") {
    if (coupon.discountType === "percent") {
      discountAmount = Math.round((amount * coupon.discountValue) / 100);
    } else {
      discountAmount = coupon.discountValue;
    }
    if (discountAmount > amount) discountAmount = amount;
  } else if (coupon.type === "freebie") {
    if (!coupon.freebieProductId) throw new Error("Freebie not configured");
    const freebie = await productModel.findById(coupon.freebieProductId);
    if (!freebie) throw new Error("Freebie not found");
    // push freebie with quantity 1 and price 0
    updatedItems.push({ ...freebie.toObject(), quantity: 1, price: 0 });
  }

  const newAmount = Math.max(0, amount - discountAmount);
  return {
    amountAfter: newAmount,
    discountAmount,
    coupon,
    items: updatedItems
  };
}

const deletePendingOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    await orderModel.findByIdAndDelete(orderId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel Order (user)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.body.userId;

    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const forbidden = ['Shipped', 'Delivered', 'Cancelled'];
    if (forbidden.includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
    }

    if (order.paymentMethod === 'Razorpay' && order.payment === true && order.razorpayPaymentId && !order.refunded) {
      await razorpayInstance.payments.refund(order.razorpayPaymentId, { amount: order.amount * 100 });
      order.refunded = true;
      order.refundDate = new Date();
    }

    order.status = 'Cancelled';
    await order.save();

    // send cancellation SMS
    sendOrderSMS(order.address.phone, order)
      .catch(err => console.error("SMS error:", err));

    return res.json({ success: true, message: 'Order cancelled and refund initiated' });
  } catch (error) {
    console.error('cancelOrder error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  verifyRazorpay,
  verifyStripe,
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  allOrders,
  userOrders,
  updateStatus,
  getOrderById,
  deletePendingOrder,
  cancelOrder,
  _applyCouponServerSide
};
