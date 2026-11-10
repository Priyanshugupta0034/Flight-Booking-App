import crypto from "crypto";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Flight from "../models/Flight.js";

function reference() { return `FB-${crypto.randomBytes(4).toString("hex").toUpperCase()}`; }

export async function createBooking(req, res, next) {
  let session;
  try {
    const { flightId, passengers } = req.body;
    if (!mongoose.isValidObjectId(flightId)) return res.status(400).json({ message: "A valid flightId is required" });
    if (!Array.isArray(passengers) || passengers.length === 0) return res.status(400).json({ message: "At least one passenger is required" });
    for (const p of passengers) {
      if (!p.name || !Number.isFinite(Number(p.age)) || !["male", "female", "other"].includes(p.gender)) {
        return res.status(400).json({ message: "Each passenger needs name, valid age, and gender (male, female, other)" });
      }
    }

    // Transactions require MongoDB replica-set support (MongoDB Atlas supports this).
    session = await mongoose.startSession();
    let created;
    await session.withTransaction(async () => {
      const flight = await Flight.findOneAndUpdate(
        { _id: flightId, status: "scheduled", availableSeats: { $gte: passengers.length } },
        { $inc: { availableSeats: -passengers.length } },
        { new: true, session }
      );
      if (!flight) {
        const err = new Error("Flight not found, cancelled, or not enough seats available");
        err.statusCode = 409;
        throw err;
      }
      const docs = await Booking.create([{
        bookingReference: reference(),
        user: req.user._id,
        flight: flight._id,
        passengers,
        totalPrice: flight.price * passengers.length
      }], { session });
      created = docs[0];
    });
    const booking = await Booking.findById(created._id).populate("flight");
    res.status(201).json({ message: "Booking confirmed", booking });
  } catch (error) { next(error); }
  finally { if (session) await session.endSession(); }
}

export async function getBooking(req, res, next) {
  try {
    const filter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
    const booking = await Booking.findOne(filter).populate("flight").populate("user", "name email");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json({ booking });
  } catch (error) { next(error); }
}

export async function requestCancellation(req, res, next) {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "confirmed") return res.status(409).json({ message: "Only confirmed bookings can request cancellation" });
    booking.status = "cancellation_requested";
    booking.cancellationReason = String(req.body.reason || "").trim();
    await booking.save();
    res.json({ message: "Cancellation requested; waiting for admin review", booking });
  } catch (error) { next(error); }
}

export async function reviewCancellation(req, res, next) {
  try {
    const { decision } = req.body;
    if (!["approve", "reject"].includes(decision)) return res.status(400).json({ message: "decision must be approve or reject" });
    const booking = await Booking.findOne({ _id: req.params.id, status: "cancellation_requested" });
    if (!booking) return res.status(404).json({ message: "Cancellation request not found" });
    if (decision === "approve") {
      const flight = await Flight.findById(booking.flight);
      if (flight) {
        flight.availableSeats = Math.min(flight.totalSeats, flight.availableSeats + booking.passengers.length);
        await flight.save();
      }
      booking.status = "cancelled";
    } else {
      booking.status = "confirmed";
    }
    booking.cancellationReviewedAt = new Date();
    await booking.save();
    res.json({ message: `Cancellation ${decision}d`, booking });
  } catch (error) { next(error); }
}

export async function listBookings(req, res, next) {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const bookings = await Booking.find(filter).populate("flight").populate("user", "name email").sort({ createdAt: -1 });
    res.json({ count: bookings.length, bookings });
  } catch (error) { next(error); }
}
