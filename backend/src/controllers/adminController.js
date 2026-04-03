import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import paginate from "../utils/paginate.js";

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
export const getDashboardStats = asyncHandler(async (_req, res) => {
  const [totalProducts, totalOrders, revenueResult, pendingOrders, recentOrders, lowStockProducts] =
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
        .limit(10),
      Product.find({ stock: { $lte: 5 }, isActive: true })
        .select("name stock images")
        .sort({ stock: 1 })
        .limit(5),
    ]);

  res.json({
    totalProducts,
    totalOrders,
    totalRevenue: revenueResult[0]?.total || 0,
    pendingOrders,
    recentOrders,
    lowStockProducts,
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

  // Restore stock when cancelling an order
  if (orderStatus === "cancelled" && order.orderStatus !== "cancelled") {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.qty },
      });
    }
  }

  order.orderStatus = orderStatus;
  const updated = await order.save();
  res.json(updated);
});

// @desc    Get all customers
// @route   GET /api/admin/customers
export const getCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  const query = { role: "user" };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const result = await paginate({
    model: User,
    query,
    page: Number(page),
    limit: Number(limit),
    sort: { createdAt: -1 },
  });

  // Get order counts and totals per user
  const userIds = result.data.map((u) => u._id);
  const orderStats = await Order.aggregate([
    { $match: { user: { $in: userIds } } },
    {
      $group: {
        _id: "$user",
        orderCount: { $sum: 1 },
        totalSpent: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] },
        },
        lastOrder: { $max: "$createdAt" },
      },
    },
  ]);

  const statsMap = Object.fromEntries(
    orderStats.map((s) => [s._id.toString(), s])
  );

  const customers = result.data.map((user) => {
    const stats = statsMap[user._id.toString()] || {};
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      googleId: user.googleId,
      role: user.role,
      isSuspended: user.isSuspended || false,
      createdAt: user.createdAt,
      orderCount: stats.orderCount || 0,
      totalSpent: stats.totalSpent || 0,
      lastOrder: stats.lastOrder || null,
    };
  });

  res.json({
    data: customers,
    currentPage: result.currentPage,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
  });
});

// @desc    Create a user (admin)
// @route   POST /api/admin/customers
export const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("Email already registered");
  }

  const user = await User.create({
    name,
    email,
    password,
    phone: phone || undefined,
    role: role || "user",
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isSuspended: user.isSuspended,
    createdAt: user.createdAt,
  });
});

// @desc    Update user role
// @route   PUT /api/admin/customers/:id/role
export const updateCustomerRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    res.status(400);
    throw new Error("Role must be 'user' or 'admin'");
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Prevent admin from demoting themselves
  if (user._id.toString() === req.user._id.toString() && role !== "admin") {
    res.status(400);
    throw new Error("You cannot change your own role");
  }

  user.role = role;
  await user.save();

  res.json({ _id: user._id, role: user.role });
});

// @desc    Suspend/unsuspend user
// @route   PUT /api/admin/customers/:id/suspend
export const toggleSuspendCustomer = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot suspend yourself");
  }

  user.isSuspended = !user.isSuspended;
  await user.save();

  res.json({ _id: user._id, isSuspended: user.isSuspended });
});

// @desc    Delete user
// @route   DELETE /api/admin/customers/:id
export const deleteCustomer = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot delete yourself");
  }

  if (user.role === "admin") {
    res.status(400);
    throw new Error("Cannot delete an admin account. Demote to user first.");
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

// @desc    Get single customer with order history
// @route   GET /api/admin/customers/:id
export const getCustomerDetail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password -passwordResetToken -passwordResetExpiry")
    .lean();

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const orders = await Order.find({ user: req.params.id })
    .populate("items.product", "name images")
    .sort({ createdAt: -1 })
    .lean();

  const totalSpent = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  res.json({
    ...user,
    orders,
    orderCount: orders.length,
    totalSpent,
  });
});
