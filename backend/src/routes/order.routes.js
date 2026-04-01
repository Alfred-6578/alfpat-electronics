import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
} from "../controllers/orderController.js";

const router = Router();

router.post("/", protect, createOrder);
router.post("/verify", verifyPayment);
router.get("/my", protect, getMyOrders);
router.get("/:id", protect, getOrderById);

export default router;
