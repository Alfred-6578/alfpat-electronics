import asyncHandler from "express-async-handler";
import cloudinary from "../config/cloudinary.js";

// @desc    Upload single image
// @route   POST /api/upload
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image file provided");
  }

  res.status(201).json({
    url: req.file.path,
    public_id: req.file.filename,
  });
});

// @desc    Upload multiple images (max 5)
// @route   POST /api/upload/multiple
export const uploadMultipleImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("No image files provided");
  }

  const images = req.files.map((file) => ({
    url: file.path,
    public_id: file.filename,
  }));

  res.status(201).json(images);
});

// @desc    Delete an image
// @route   DELETE /api/upload/:publicId
export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  const result = await cloudinary.uploader.destroy(`alfpat-electronics/${publicId}`);

  if (result.result !== "ok") {
    res.status(400);
    throw new Error("Failed to delete image");
  }

  res.json({ message: "Image deleted" });
});
