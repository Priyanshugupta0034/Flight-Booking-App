import mongoose from "mongoose";

const flightSchema = new mongoose.Schema({
  airline: { type: String, required: true, trim: true },
  flightNumber: { type: String, required: true, trim: true, unique: true },
  origin: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 },
  totalSeats: { type: Number, required: true, min: 1 },
  availableSeats: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["scheduled", "delayed", "cancelled"], default: "scheduled" }
}, { timestamps: true });

flightSchema.index({ origin: 1, destination: 1, departureTime: 1 });
export default mongoose.model("Flight", flightSchema);
