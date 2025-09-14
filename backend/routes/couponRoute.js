import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { createCoupon, getCoupons, validateCoupon } from "../controllers/couponController.js";

const router = express.Router();

// admin protected
router.post("/", adminAuth, createCoupon);
router.get("/", adminAuth, getCoupons);

// public for validation (users)
router.post("/validate", validateCoupon);

export default router;
