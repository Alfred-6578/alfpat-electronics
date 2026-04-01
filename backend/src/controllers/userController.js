import crypto from "crypto";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @desc    Get user profile
// @route   GET /api/users/profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password -resetPasswordToken -resetPasswordExpires")
    .populate("wishlist", "name slug price discountPrice images");
  res.json(user);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, phone, address } = req.body;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;

  const updated = await user.save();

  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    address: updated.address,
    role: updated.role,
  });
});

// @desc    Change password
// @route   PUT /api/users/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Please provide current and new password");
  }

  const user = await User.findById(req.user._id);

  if (!user.password) {
    res.status(400);
    throw new Error("Account uses Google sign-in. Set a password via forgot password instead");
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password updated successfully" });
});

// @desc    Forgot password — generate reset token
// @route   POST /api/users/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Please provide an email");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("No account with that email");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  // TODO: Send email with resetUrl
  console.log(`Password reset link: ${resetUrl}`);

  res.json({ message: "Password reset link generated", resetUrl });
});

// @desc    Reset password with token
// @route   POST /api/users/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error("Please provide a new password");
  }

  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const token = generateToken(user._id);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token,
  });
});

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist/:productId
export const addToWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.wishlist.includes(req.params.productId)) {
    res.status(400);
    throw new Error("Product already in wishlist");
  }

  user.wishlist.push(req.params.productId);
  await user.save();

  const updated = await User.findById(req.user._id)
    .select("wishlist")
    .populate("wishlist", "name slug price discountPrice images");

  res.json(updated.wishlist);
});

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { wishlist: req.params.productId },
  });

  const updated = await User.findById(req.user._id)
    .select("wishlist")
    .populate("wishlist", "name slug price discountPrice images");

  res.json(updated.wishlist);
});

// @desc    Get wishlist
// @route   GET /api/users/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("wishlist")
    .populate("wishlist", "name slug price discountPrice images stock isActive");

  res.json(user.wishlist);
});
