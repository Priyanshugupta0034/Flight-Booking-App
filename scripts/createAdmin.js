import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

try {
  await connectDB();
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in .env");
  if (ADMIN_PASSWORD.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  const email = ADMIN_EMAIL.toLowerCase().trim();
  let user = await User.findOne({ email });
  if (user) {
    user.role = "admin";
    user.name = ADMIN_NAME;
    user.password = ADMIN_PASSWORD;
    await user.save();
    console.log(`Existing account promoted to admin: ${email}`);
  } else {
    user = await User.create({ name: ADMIN_NAME, email, password: ADMIN_PASSWORD, role: "admin" });
    console.log(`Admin account created: ${email}`);
  }
} catch (error) {
  console.error("Could not create admin:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
