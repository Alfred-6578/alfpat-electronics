import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import paginate from "../utils/paginate.js";

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
export const getDashboardStats = asyncHandler(async (_req, res) => {
  const [totalProducts, totalOrders, revenueResult, pendingOrders, recentOrders] =
    await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.countDocuments({ orderStatus: "processing" }),
      Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

  res.json({
    totalProducts,
    totalOrders,
    totalRevenue: revenueResult[0]?.total || 0,
    pendingOrders,
    recentOrders,
  });
});

// @desc    Get all products (admin, includes inactive)
// @route   GET /api/admin/products
export const getAdminProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await paginate({
    model: Product,
    query: {},
    page: Number(page),
    limit: Number(limit),
    populate: "category",
    sort: { createdAt: -1 },
  });

  res.json(result);
});

// @desc    Create a product
// @route   POST /api/admin/products
export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category } = req.body;

  if (!name || !description || !price || !category) {
    res.status(400);
    throw new Error("Please provide name, description, price, and category");
  }

  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// @desc    Update a product
// @route   PUT /api/admin/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  Object.assign(product, req.body);
  const updated = await product.save();
  res.json(updated);
});

// @desc    Soft delete a product
// @route   DELETE /api/admin/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  product.isActive = false;
  await product.save();
  res.json({ message: "Product deactivated successfully" });
});

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
export const getAdminOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await paginate({
    model: Order,
    query: {},
    page: Number(page),
    limit: Number(limit),
    populate: [
      { path: "user", select: "name email" },
      { path: "items.product", select: "name" },
    ],
    sort: { createdAt: -1 },
  });

  res.json(result);
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const valid = ["processing", "shipped", "delivered", "cancelled"];

  if (!valid.includes(orderStatus)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${valid.join(", ")}`);
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.orderStatus = orderStatus;
  const updated = await order.save();
  res.json(updated);
});
