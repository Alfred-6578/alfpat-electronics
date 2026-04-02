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

// @desc    Get saved addresses
// @route   GET /api/users/addresses
export const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("savedAddresses");
  res.json(user.savedAddresses);
});

// @desc    Add a new address
// @route   POST /api/users/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const { label, fullName, phone, street, city, state, isDefault } = req.body;

  if (!fullName || !phone || !street || !city || !state) {
    res.status(400);
    throw new Error("All address fields are required");
  }

  const user = await User.findById(req.user._id);

  // Check for duplicate address
  const duplicate = user.savedAddresses.find(
    (addr) =>
      addr.fullName.toLowerCase() === fullName.toLowerCase() &&
      addr.phone === phone &&
      addr.street.toLowerCase() === street.toLowerCase() &&
      addr.city.toLowerCase() === city.toLowerCase() &&
      addr.state.toLowerCase() === state.toLowerCase()
  );

  if (duplicate) {
    // Not an error — just return existing addresses silently
    return res.json(user.savedAddresses);
  }

  // If this is set as default, unset all others
  if (isDefault) {
    user.savedAddresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  // If first address, make it default
  const makeDefault = user.savedAddresses.length === 0 ? true : !!isDefault;

  user.savedAddresses.push({
    label: label || "Home",
    fullName,
    phone,
    street,
    city,
    state,
    isDefault: makeDefault,
  });

  await user.save();
  res.status(201).json(user.savedAddresses);
});

// @desc    Update an address
// @route   PUT /api/users/addresses/:addressId
export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.savedAddresses.id(req.params.addressId);

  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  const { label, fullName, phone, street, city, state, isDefault } = req.body;

  if (isDefault) {
    user.savedAddresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  if (label !== undefined) address.label = label;
  if (fullName !== undefined) address.fullName = fullName;
  if (phone !== undefined) address.phone = phone;
  if (street !== undefined) address.street = street;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (isDefault !== undefined) address.isDefault = isDefault;

  await user.save();
  res.json(user.savedAddresses);
});

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:addressId
export const deleteAddress = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { savedAddresses: { _id: req.params.addressId } },
  });

  const user = await User.findById(req.user._id).select("savedAddresses");
  res.json(user.savedAddresses);
});

// @desc    Set an address as default
// @route   PUT /api/users/addresses/:addressId/default
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  user.savedAddresses.forEach((addr) => {
    addr.isDefault = addr._id.toString() === req.params.addressId;
  });

  await user.save();
  res.json(user.savedAddresses);
});
