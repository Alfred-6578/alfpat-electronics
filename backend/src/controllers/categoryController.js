import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

// @desc    Get all categories
// @route   GET /api/categories
export const getAllCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();

  const counts = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  const result = categories.map((cat) => ({
    ...cat,
    productsCount: countMap[cat._id.toString()] || 0,
  }));

  res.json(result);
});

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.json(category);
});

// @desc    Create a category
// @route   POST /api/categories
export const createCategory = asyncHandler(async (req, res) => {
  const { name, image, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Category name is required");
  }

  const category = await Category.create({ name, image, description });
  res.status(201).json(category);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const { name, image, description } = req.body;
  if (name !== undefined) category.name = name;
  if (image !== undefined) category.image = image;
  if (description !== undefined) category.description = description;

  const updated = await category.save();
  res.json(updated);
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.json({ message: "Category deleted" });
});
