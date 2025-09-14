import Coupon from "../models/couponModel.js";
import productModel from "../models/productModel.js"; // for freebies

// Admin - create coupon
export const createCoupon = async (req, res) => {
  try {
    const data = { ...req.body };

    // Normalize code to uppercase to avoid duplicates like 'SAVE10' vs 'save10'
    if (data.code) {
      data.code = data.code.trim().toUpperCase();
    }

    // If freebieProductId is empty, remove it so mongoose won't try to cast ""
    if (!data.freebieProductId || data.freebieProductId.trim() === "") {
      delete data.freebieProductId;
    }

    const coupon = await Coupon.create(data);
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Admin - list coupons
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Validate coupon (user side)
export const validateCoupon = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Coupon code required" });
    }

    const codeNorm = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: codeNorm, isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon" });
    }

    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ success: false, message: "Coupon expired" });
    }

    if (totalAmount < (coupon.minPurchase || 0)) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase ₹${coupon.minPurchase} required`
      });
    }

    let discountAmount = 0;
    let freebie = null;

    if (coupon.type === "discount") {
      if (coupon.discountType === "percent") {
        discountAmount = Math.round((totalAmount * coupon.discountValue) / 100);
      } else {
        discountAmount = coupon.discountValue;
      }
      if (discountAmount > totalAmount) discountAmount = totalAmount;
    } else if (coupon.type === "freebie") {
      if (!coupon.freebieProductId) {
        return res.status(400).json({ success: false, message: "Freebie not configured for this coupon" });
      }
      freebie = await productModel.findById(coupon.freebieProductId);
      if (!freebie) {
        return res.status(400).json({ success: false, message: "Freebie product not found" });
      }
    }

    return res.json({
      success: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchase: coupon.minPurchase,
        expiryDate: coupon.expiryDate
      },
      discountAmount,
      freebie: freebie
        ? {
            _id: freebie._id,
            name: freebie.name,
            price: freebie.price,
            thumbnail: freebie.thumbnail
          }
        : null
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
