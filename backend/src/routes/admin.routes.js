import { Router } from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getDashboardStats,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminOrders,
  updateOrderStatus,
  getCustomers,
  getCustomerDetail,
  createCustomer,
  updateCustomerRole,
  toggleSuspendCustomer,
  deleteCustomer,
} from "../controllers/adminController.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/dashboard", getDashboardStats);
router.get("/products", getAdminProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.get("/orders", getAdminOrders);
router.put("/orders/:id", updateOrderStatus);
router.get("/customers", getCustomers);
router.get("/customers/:id", getCustomerDetail);
router.post("/customers", createCustomer);
router.put("/customers/:id/role", updateCustomerRole);
router.put("/customers/:id/suspend", toggleSuspendCustomer);
router.delete("/customers/:id", deleteCustomer);

export default router;
