import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 0, max: 120 },
  gender: { type: String, enum: ["male", "female", "other"], required: true }
}, { _id: true });

const bookingSchema = new mongoose.Schema({
  bookingReference: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  flight: { type: mongoose.Schema.Types.ObjectId, ref: "Flight", required: true },
  passengers: { type: [passengerSchema], required: true, validate: v => v.length > 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["confirmed", "cancellation_requested", "cancelled"], default: "confirmed" },
  cancellationReason: { type: String, default: "" },
  cancellationReviewedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
