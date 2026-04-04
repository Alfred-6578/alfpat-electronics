import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getCart, saveCart, mergeCart, clearCartDB } from "../controllers/cartController.js";

const router = Router();

router.use(protect);

router.get("/", getCart);
router.put("/", saveCart);
router.post("/merge", mergeCart);
router.delete("/", clearCartDB);

export default router;
