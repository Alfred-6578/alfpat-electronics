import { Router } from "express";
import { getAllProducts, getProductBySlug } from "../controllers/productController.js";

const router = Router();

router.get("/", getAllProducts);
router.get("/:slug", getProductBySlug);

export default router;
