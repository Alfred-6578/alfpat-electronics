import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Product from "../models/Product.js";

// @desc    Get user's saved cart (populated with product details)
// @route   GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("cart")
    .populate("cart.product", "name slug price discountPrice images stock isActive");

  const items = (user.cart || [])
    .filter((item) => item.product && item.product.isActive)
    .map((item) => ({
      _id: item.product._id,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      discountPrice: item.product.discountPrice || null,
      image: item.product.images?.[0] || "",
      stock: item.product.stock,
      qty: Math.min(item.qty, item.product.stock),
    }));

  res.json(items);
});

// @desc    Save/sync cart to DB
// @route   PUT /api/cart
export const saveCart = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    res.status(400);
    throw new Error("Items must be an array");
  }

  // Validate and build cart
  const cart = [];
  for (const item of items) {
    if (!item._id || !item.qty || item.qty < 1) continue;

    const product = await Product.findById(item._id);
    if (!product || !product.isActive) continue;

    cart.push({
      product: product._id,
      qty: Math.min(item.qty, product.stock),
    });
  }

  await User.findByIdAndUpdate(req.user._id, { cart });
  res.json({ message: "Cart saved", count: cart.length });
});

// @desc    Merge local cart with DB cart (on login)
// @route   POST /api/cart/merge
export const mergeCart = asyncHandler(async (req, res) => {
  const { localItems } = req.body;

  if (!Array.isArray(localItems)) {
    res.status(400);
    throw new Error("localItems must be an array");
  }

  const user = await User.findById(req.user._id).select("cart");
  const dbCart = user.cart || [];

  // Build a map of DB cart: productId → qty
  const merged = new Map();
  for (const item of dbCart) {
    merged.set(item.product.toString(), item.qty);
  }

  // Merge local items — local takes priority for qty (user's latest intent)
  for (const item of localItems) {
    if (!item._id || !item.qty || item.qty < 1) continue;
    merged.set(item._id, item.qty);
  }

  // Validate all products and cap qty at stock
  const cart = [];
  const responseItems = [];

  for (const [productId, qty] of merged) {
    const product = await Product.findById(productId)
      .select("name slug price discountPrice images stock isActive");

    if (!product || !product.isActive) continue;

    const cappedQty = Math.min(qty, product.stock);
    if (cappedQty < 1) continue;

    cart.push({ product: product._id, qty: cappedQty });
    responseItems.push({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountPrice: product.discountPrice || null,
      image: product.images?.[0] || "",
      stock: product.stock,
      qty: cappedQty,
    });
  }

  // Save merged cart to DB
  await User.findByIdAndUpdate(req.user._id, { cart });

  res.json(responseItems);
});

// @desc    Clear cart in DB
// @route   DELETE /api/cart
export const clearCartDB = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { cart: [] });
  res.json({ message: "Cart cleared" });
});
