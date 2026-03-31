import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import paginate from "../utils/paginate.js";

// @desc    Get all active products (with filtering, search, sort, pagination)
// @route   GET /api/products
export const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, category, search, sort } = req.query;

  const filter = { isActive: true };

  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) filter.category = cat._id;
  }

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  let sortObj;
  switch (sort) {
    case "price_asc":
      sortObj = { price: 1 };
      break;
    case "price_desc":
      sortObj = { price: -1 };
      break;
    default:
      sortObj = { createdAt: -1 };
  }

  const result = await paginate({
    model: Product,
    query: filter,
    page: Number(page),
    limit: Number(limit),
    populate: "category",
    sort: sortObj,
  });

  res.json(result);
});

// @desc    Get single product by slug
// @route   GET /api/products/:slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    isActive: true,
  }).populate("category");

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json(product);
});
