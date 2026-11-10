import jwt from "jsonwebtoken";
import User from "../models/User.js";

function createToken(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("Set JWT_SECRET in .env to a random secret at least 32 characters long.");
  }
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture };
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "name, email, and password are required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: "Email is already registered" });
    const user = await User.create({ name, email: normalizedEmail, password });
    res.status(201).json({ message: "Registration successful", token: createToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: "Invalid email or password" });
    res.json({ message: "Login successful", token: createToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
}
