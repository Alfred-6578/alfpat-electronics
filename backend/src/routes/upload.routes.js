import { Router } from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";
import { uploadImage, uploadMultipleImages, deleteImage } from "../controllers/uploadController.js";

const router = Router();

router.use(protect, adminOnly);

router.post("/", upload.single("image"), uploadImage);
router.post("/multiple", upload.array("images", 5), uploadMultipleImages);
router.delete("/:publicId", deleteImage);

export default router;
