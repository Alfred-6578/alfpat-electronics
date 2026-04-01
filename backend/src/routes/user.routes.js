import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../controllers/userController.js";

const router = Router();

// Public
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.get("/wishlist", protect, getWishlist);
router.post("/wishlist/:productId", protect, addToWishlist);
router.delete("/wishlist/:productId", protect, removeFromWishlist);

export default router;
