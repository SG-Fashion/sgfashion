// routes/admin.js
import express from "express";
import userModel from "../models/userModel.js";
import adminAuth from "../middleware/adminAuth.js"; // if you want to restrict to admin

const adminRouter = express.Router();

adminRouter.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await userModel.find({}, "name email cartData createdAt");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default adminRouter;
