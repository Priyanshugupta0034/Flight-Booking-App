# Flight Booking System API

A REST API built with Node.js, Express, MongoDB/Mongoose, ES modules, JWT authentication, and role-based admin routes.

## Important dependency fix

This version intentionally **does not use `multer-storage-cloudinary`**. Profile pictures are stored locally in `uploads/` with Multer, avoiding the Cloudinary v1/v2 peer-dependency conflict that caused `npm ERESOLVE`.

## Requirements

- Node.js 18 or later
- MongoDB running locally, or a MongoDB Atlas connection string
- npm

## Setup on Windows / VS Code

1. Extract the ZIP and open the `flight-booking-system-fixed` folder in VS Code.
2. In the terminal, run:

   ```powershell
   npm install
   Copy-Item .env.example .env
   ```

3. Open `.env`. Set `MONGODB_URI` and replace `JWT_SECRET` with a random secret of at least 32 characters. Set a strong `ADMIN_PASSWORD`.
4. Make sure MongoDB is running, then create the admin user:

   ```powershell
   npm run create-admin
   ```

5. Start the API:

   ```powershell
   npm run dev
   ```

6. Test in browser: `http://localhost:5000/api/health`

Example strong secret generation in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the output into `JWT_SECRET` in `.env`. Do not share or commit `.env`.

## MongoDB transactions note

Booking creation uses a transaction to keep seat counts consistent. MongoDB transactions require a replica set. MongoDB Atlas supports this. A local standalone MongoDB server must be configured as a single-node replica set before booking transactions will work.

## API overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a user |
| POST | `/auth/login` | Public | Log in |
| GET | `/users/me` | User | View profile |
| PATCH | `/users/me` | User | Update name / upload profile picture |
| GET | `/users/me/bookings` | User | View own bookings |
| GET | `/flights` | Public | Search flights |
| GET | `/flights/:id` | Public | Flight details |
| POST | `/flights` | Admin | Create flight |
| PATCH | `/flights/:id` | Admin | Update flight |
| DELETE | `/flights/:id` | Admin | Delete flight if no seats are booked |
| POST | `/bookings` | User | Book seats |
| GET | `/bookings/:id` | Owner/Admin | View booking |
| POST | `/bookings/:id/cancellation` | Owner | Request cancellation |
| GET | `/bookings` | Admin | List bookings |
| PATCH | `/bookings/:id/cancellation` | Admin | Approve/reject cancellation |
| GET | `/users` | Admin | List users |
| PATCH | `/users/:id/role` | Admin | Change user role |

### Register example

`POST /api/auth/register`

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "StrongPassword123!"
}
```

### Login example

`POST /api/auth/login`

```json
{
  "email": "test@example.com",
  "password": "StrongPassword123!"
}
```

Send the returned token on protected routes:

`Authorization: Bearer YOUR_TOKEN`

### Search flights example

`GET /api/flights?origin=Delhi&destination=Mumbai&date=2026-12-01&passengers=2`

### Create flight example (admin token required)

`POST /api/flights`

```json
{
  "airline": "Example Air",
  "flightNumber": "EA101",
  "origin": "Delhi",
  "destination": "Mumbai",
  "departureTime": "2026-12-01T08:00:00.000Z",
  "arrivalTime": "2026-12-01T10:15:00.000Z",
  "price": 4500,
  "totalSeats": 180
}
```

### Create booking example (user token required)

`POST /api/bookings`

```json
{
  "flightId": "REPLACE_WITH_FLIGHT_OBJECT_ID",
  "passengers": [
    { "name": "Test User", "age": 25, "gender": "other" }
  ]
}
```

### Profile picture upload

Use `PATCH /api/users/me` with `multipart/form-data`. Optional fields: `name` and `profilePicture` (file, JPG/PNG/WEBP, max 2 MB). The returned profile picture URL is relative, e.g. `/uploads/123-image.png`.

## Notes

- This is a learning project, not production-ready payment processing.
- Configure HTTPS, secrets, logging, input validation, and deployment settings before production use.
