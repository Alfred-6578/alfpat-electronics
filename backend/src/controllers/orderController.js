import crypto from "crypto";
import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { initializePayment, verifyPayment as verifyPaystack } from "../services/paystackService.js";
import { sendOrderNotification } from "../services/whatsappService.js";
import paginate from "../utils/paginate.js";

// @desc    Create a new order
// @route   POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("Order must contain at least one item");
  }

  if (
    !shippingAddress?.fullName ||
    !shippingAddress?.phone ||
    !shippingAddress?.street ||
    !shippingAddress?.city ||
    !shippingAddress?.state
  ) {
    res.status(400);
    throw new Error("Shipping address must include fullName, phone, street, city, and state");
  }

  // Calculate total server-side
  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);

    if (!product || !product.isActive) {
      res.status(400);
      throw new Error(`Product not found or unavailable: ${item.product}`);
    }

    if (product.stock < item.qty) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}`);
    }

    const price = product.discountPrice || product.price;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0],
      qty: item.qty,
      price,
    });

    totalAmount += price * item.qty;
  }

  // Reduce stock for each item
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.qty },
    });
  }

  const paymentReference =
    "ALFPAT-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9).toUpperCase();

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    totalAmount,
    paymentReference,
    paymentStatus: "pending",
    orderStatus: "processing",
  });

  const email = req.user.email;

  const { authorizationUrl } = await initializePayment({
    email,
    amount: totalAmount,
    reference: paymentReference,
  });

  await sendOrderNotification(order);

  res.status(201).json({ order, paymentUrl: authorizationUrl });
});

// @desc    Verify payment via Paystack
// @route   POST /api/orders/verify
export const verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.body;

  const order = await Order.findOne({ paymentReference: reference });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const result = await verifyPaystack(reference);

  if (result.success) {
    order.paymentStatus = "paid";
  } else {
    order.paymentStatus = "failed";
    // Restore stock on failed payment
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.qty },
      });
    }
  }

  await order.save();
  res.json(order);
});

// @desc    Paystack webhook handler
// @route   POST /api/orders/webhook
export const paystackWebhook = async (req, res) => {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const { event, data } = req.body;

  if (event === "charge.success") {
    const order = await Order.findOne({ paymentReference: data.reference });

    if (order && order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      await order.save();
      console.log(`Webhook: Order ${data.reference} marked as paid`);
    }
  }

  // Always respond 200 so Paystack doesn't retry
  res.sendStatus(200);
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my
export const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await paginate({
    model: Order,
    query: { user: req.user._id },
    page: Number(page),
    limit: Number(limit),
    populate: { path: "items.product", select: "name images" },
    sort: { createdAt: -1 },
  });

  res.json(result);
});

// @desc    Get single order by ID
// @route   GET /api/orders/:id
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("items.product", "name images");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    order.user &&
    String(order.user._id) !== String(req.user._id) &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }

  res.json(order);
});
