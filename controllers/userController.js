import User from "../models/User.js";
import Booking from "../models/Booking.js";

export async function getProfile(req, res) {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, profilePicture: req.user.profilePicture } });
}

export async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    if (name !== undefined) req.user.name = name.trim();
    if (req.file) req.user.profilePicture = `/uploads/${req.file.filename}`;
    await req.user.save();
    res.json({ message: "Profile updated", user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, profilePicture: req.user.profilePicture } });
  } catch (error) { next(error); }
}

export async function myBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate("flight").sort({ createdAt: -1 });
    res.json({ count: bookings.length, bookings });
  } catch (error) { next(error); }
}

export async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (error) { next(error); }
}

export async function changeUserRole(req, res, next) {
  try {
    if (!["user", "admin"].includes(req.body.role)) return res.status(400).json({ message: "role must be user or admin" });
    if (String(req.user._id) === req.params.id && req.body.role !== "admin") return res.status(400).json({ message: "You cannot remove your own admin role" });
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true, runValidators: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User role updated", user });
  } catch (error) { next(error); }
}
