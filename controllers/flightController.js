import Flight from "../models/Flight.js";

export async function searchFlights(req, res, next) {
  try {
    const { origin, destination, date, passengers = "1" } = req.query;
    const filter = { status: "scheduled", availableSeats: { $gte: Math.max(1, Number(passengers) || 1) } };
    if (origin) filter.origin = new RegExp(`^${escapeRegex(origin.trim())}$`, "i");
    if (destination) filter.destination = new RegExp(`^${escapeRegex(destination.trim())}$`, "i");
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) return res.status(400).json({ message: "date must be YYYY-MM-DD" });
      const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
      filter.departureTime = { $gte: start, $lt: end };
    }
    const flights = await Flight.find(filter).sort({ departureTime: 1 });
    res.json({ count: flights.length, flights });
  } catch (error) { next(error); }
}
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export async function getFlight(req, res, next) {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) return res.status(404).json({ message: "Flight not found" });
    res.json({ flight });
  } catch (error) { next(error); }
}

export async function createFlight(req, res, next) {
  try {
    const body = req.body;
    const flight = await Flight.create({ ...body, availableSeats: body.availableSeats ?? body.totalSeats });
    res.status(201).json({ message: "Flight created", flight });
  } catch (error) { next(error); }
}

export async function updateFlight(req, res, next) {
  try {
    const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!flight) return res.status(404).json({ message: "Flight not found" });
    res.json({ message: "Flight updated", flight });
  } catch (error) { next(error); }
}

export async function deleteFlight(req, res, next) {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) return res.status(404).json({ message: "Flight not found" });
    if (flight.availableSeats !== flight.totalSeats) return res.status(409).json({ message: "Cannot delete a flight that has bookings. Set status to cancelled instead." });
    await flight.deleteOne();
    res.json({ message: "Flight deleted" });
  } catch (error) { next(error); }
}
