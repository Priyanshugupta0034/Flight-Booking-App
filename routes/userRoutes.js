import { Router } from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { getProfile, updateProfile, myBookings, listUsers, changeUserRole } from "../controllers/userController.js";
import { uploadProfilePicture } from "../middleware/uploadMiddleware.js";

const router = Router();
router.get("/me", protect, getProfile);
router.patch("/me", protect, uploadProfilePicture, updateProfile);
router.get("/me/bookings", protect, myBookings);
router.get("/", protect, adminOnly, listUsers);
router.patch("/:id/role", protect, adminOnly, changeUserRole);
export default router;
