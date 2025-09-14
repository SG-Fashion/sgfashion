import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // upper-case recommended
  type: { type: String, enum: ["discount", "freebie"], required: true },
  // for discounts:
  discountType: { type: String, enum: ["percent", "fixed"], default: "percent" },
  discountValue: { type: Number, default: 0 }, // percent (0-100) if percent, or fixed amount if fixed
  // for freebies:
  freebieProductId: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: false },

  minPurchase: { type: Number, default: 0 }, // minimum order amount to use coupon
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },

  // optional: usage limit per coupon or per user (not implemented here)
}, { timestamps: true });

export default mongoose.model("Coupon", couponSchema);
