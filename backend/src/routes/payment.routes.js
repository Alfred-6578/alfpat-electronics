import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  initializePayment,
  handleWebhook,
  getOrderByReference,
} from "../controllers/paymentController.js";

const router = Router();

const validateReference = (req, res, next) => {
  const { reference } = req.params;
  if (!reference || reference.trim().length < 5) {
    return res.status(400).json({
      found: false,
      error: "invalid_reference",
      message: "Invalid reference",
    });
  }
  next();
};

router.post("/initialize", protect, initializePayment);
router.post("/webhook", handleWebhook);
router.get("/order/:reference", validateReference, protect, getOrderByReference);

export default router;
