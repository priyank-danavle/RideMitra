# RideMitra REST API Reference

- **Base URL:** `/api/v1` (e.g., `http://localhost:5000/api/v1`)
- **Version:** `0.1.0`
- **Interactive Swagger UI:** `GET /api/v1/docs`
- **OpenAPI 3.0 Specification:** `GET /api/v1/docs/openapi.json`

---

## 1. Authentication & Security

RideMitra supports two secure authentication mechanisms:

1. **HTTP-Only Secure Cookie (Default for Web Client)**
   - Cookie name: `ridemitra_token`
   - Properties: `httpOnly: true`, `secure: isProduction`, `sameSite: strict/lax`, `path: '/'`
   - Lifetime: 7 days
2. **Bearer Token (API / Mobile Client Alternative)**
   - Header: `Authorization: Bearer <jwt-token>`

Every issued token is backed by an active row in the `sessions` table. Calling `POST /api/v1/auth/logout` revokes the token in the database immediately.

---

## 2. Standard Response Envelope

All API endpoints return standard structured JSON payloads.

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Specific error description",
    "details": { ... }
  }
}
```

### Standard Error Codes
| Error Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Payload failed schema validation (Zod) |
| `INVALID_CREDENTIALS` | 401 | Email or password incorrect |
| `UNAUTHORIZED` | 401 | Authentication required or token invalid/expired |
| `FORBIDDEN` | 403 | Caller lacks ownership or role permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `EMAIL_ALREADY_EXISTS` | 409 | User registration conflict |
| `VEHICLE_NOT_FOUND` | 403 / 404 | Vehicle unowned or non-existent |
| `VEHICLE_INACTIVE` | 400 | Vehicle is deactivated/soft-deleted |
| `INVALID_CAPACITY` | 400 | Bike must have exactly 1 seat; car 1-8 |
| `EXCEEDS_VEHICLE_CAPACITY` | 400 | Offered seats exceed vehicle capacity |
| `BOOKING_ERROR` | 400 / 404 | Generic domain booking issue |
| `INSUFFICIENT_SEATS` | 409 | Ride capacity exhausted |
| `DUPLICATE_ACTIVE_BOOKING` | 409 | Passenger already has pending/confirmed booking |

---

## 3. Endpoints Directory

### Health & System Probes
- `GET /` — Service status check and router catalog
- `GET /api/v1/health` — Liveness check probe (200 OK)
- `GET /api/v1/ready` — Readiness check probe (verifies MySQL database connectivity)
- `GET /api/v1/docs` — Interactive Swagger UI
- `GET /api/v1/docs/openapi.json` — Machine-readable OpenAPI 3.0 specification

---

### Authentication (`/api/v1/auth`)

#### `POST /api/v1/auth/register`
Registers a new user account, hashes the password via bcrypt (salt rounds = 12), creates an active session, and sets the cookie.
- **Access:** Public (Rate limited)
- **Request Body:**
```json
{
  "name": "Pooja Sharma",
  "email": "pooja.sharma@example.com",
  "password": "Password123!"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "name": "Pooja Sharma",
      "email": "pooja.sharma@example.com",
      "phone": null,
      "bio": null,
      "role": "USER",
      "isEmailVerified": false,
      "isPhoneVerified": false,
      "createdAt": "2026-10-18T12:00:00.000Z",
      "updatedAt": "2026-10-18T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
}
```

#### `POST /api/v1/auth/login`
Authenticates email and password, creates an active session in MySQL, and sets the session cookie.
- **Access:** Public (Rate limited)
- **Request Body:**
```json
{
  "email": "pooja.sharma@example.com",
  "password": "Password123!"
}
```
- **Response (200 OK):** Same payload as register.

#### `POST /api/v1/auth/logout`
Revokes the current session token in MySQL and clears the session cookie.
- **Access:** Authenticated
- **Response (200 OK):**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully." }
}
```

#### `GET /api/v1/auth/me`
Returns the current authenticated user's safe profile.
- **Access:** Authenticated
- **Response (200 OK):**
```json
{
  "success": true,
  "data": { "user": { "id": "...", "name": "...", "email": "...", "role": "USER" } }
}
```

---

### User Profile (`/api/v1/users`)

#### `GET /api/v1/users/profile`
Retrieve full profile for authenticated user.
- **Access:** Authenticated

#### `PATCH /api/v1/users/profile`
Update permitted profile attributes (`name`, `phone`, `bio`). Mass-assignment protection strictly rejects `id`, `email`, `role`, or timestamps.
- **Access:** Authenticated
- **Request Body:**
```json
{
  "name": "Pooja S.",
  "phone": "+919876543210",
  "bio": "Daily commuter between Gandhinagar and Ahmedabad."
}
```
- **Response (200 OK):** Updated user profile.

---

### Vehicle Management (`/api/v1/vehicles`)

#### `POST /api/v1/vehicles`
Registers a vehicle under the authenticated user.
- **Access:** Authenticated
- **Validation Rules:**
  - `type`: `'CAR'` or `'BIKE'`
  - `capacity`: Strictly `1` for BIKE; `1` to `8` for CAR
  - `registrationNumber`: Alphanumeric with optional dashes
- **Request Body:**
```json
{
  "type": "CAR",
  "make": "Tata",
  "model": "Safari",
  "year": 2023,
  "color": "Starlight Black",
  "registrationNumber": "GJ-01-BK-9999",
  "capacity": 6
}
```

#### `GET /api/v1/vehicles`
Lists all active vehicles registered by the authenticated user.

#### `GET /api/v1/vehicles/:id`
Retrieves a single vehicle, verifying owner ownership. Returns `404` if unowned or inactive.

#### `PATCH /api/v1/vehicles/:id`
Updates vehicle make, model, year, color, or capacity. Rejects modifying registration number or vehicle type directly.

#### `DELETE /api/v1/vehicles/:id`
Soft-deletes the vehicle (`is_active = FALSE`). Deactivated vehicles cannot be used to publish new rides.

---

### Ride Management & Search (`/api/v1/rides`)

#### `POST /api/v1/rides`
Publishes a new ride offer.
- **Access:** Authenticated
- **Validation Rules:**
  - `vehicleId`: Must belong to driver and be active (`is_active = TRUE`).
  - `departureTime`: Must be in the future (`> NOW()`).
  - `availableSeats`: Cannot exceed vehicle capacity (strictly 1 for BIKE).
- **Request Body:**
```json
{
  "vehicleId": "d3b07384-d113-46fb-9c5e-8e65e6833c94",
  "type": "INTERCITY",
  "origin": "Ahmedabad",
  "destination": "Surat",
  "pickupPoint": "C.G. Road",
  "dropoffPoint": "Majura Gate",
  "departureTime": "2026-10-25T08:30:00.000Z",
  "availableSeats": 3,
  "pricePerSeat": 350,
  "description": "Smooth AC ride, strictly non-smoking."
}
```

#### `GET /api/v1/rides`
Searches published, scheduled upcoming rides matching criteria.
- **Access:** Public
- **Query Parameters:**
  - `origin`: Partial string match (case-insensitive)
  - `destination`: Partial string match (case-insensitive)
  - `date`: Departure date filter (`YYYY-MM-DD`)
  - `type`: `'CITY'` or `'INTERCITY'`
  - `vehicleType`: `'ALL'`, `'CAR'`, or `'BIKE'`
  - `minSeats`: Minimum seats required
  - `minPrice`, `maxPrice`: Price range filters
  - `sortBy`: `'departureTime'` or `'price'` (default: `'departureTime'`)
  - `sortOrder`: `'asc'` or `'desc'` (default: `'asc'`)
  - `page`: Page index (1-based, default: 1)
  - `limit`: Items per page (default: 10, max: 50)

#### `GET /api/v1/rides/driver/mine`
Retrieves rides offered by the authenticated driver. Supports `status` query filter (`SCHEDULED`, `ACTIVE`, `COMPLETED`, `CANCELLED`, `ALL`).

#### `GET /api/v1/rides/:id`
Returns complete ride details including driver public profile and vehicle specifications.

#### `PATCH /api/v1/rides/:id`
Updates pickup point, dropoff point, departure time, available seats, price, or description. Only allowed if ride is `SCHEDULED`.

#### `POST /api/v1/rides/:id/cancel` (and `DELETE /api/v1/rides/:id`)
Cancels a scheduled ride. Atomically updates `rides.status = 'CANCELLED'` and cascades cancellation to all active `PENDING` and `CONFIRMED` passenger bookings.

---

### Booking Engine (`/api/v1/bookings`)

#### `POST /api/v1/bookings`
Passenger submits a booking request for a scheduled ride.
- **Access:** Authenticated
- **Business Rules:**
  - Self-booking own ride is rejected (`400`).
  - Booking on cancelled or completed rides is rejected (`400`).
  - Booking past departure rides is rejected (`400`).
  - Requesting more seats than currently available returns `409 INSUFFICIENT_SEATS`.
  - Duplicate active bookings by same passenger return `409 DUPLICATE_ACTIVE_BOOKING`.
  - Seat count must be an integer between 1 and 8.
- **Request Body:**
```json
{
  "rideId": "550e8400-e29b-41d4-a716-446655440000",
  "seatsBooked": 2
}
```
- **Response (201 Created):** Creates booking in `PENDING` status. Server calculates authoritative snapshot price.

#### `GET /api/v1/bookings/passenger/mine`
Lists all bookings made by the authenticated passenger with optional `status` filter.

#### `GET /api/v1/bookings/driver/mine`
Lists booking requests across all rides offered by the authenticated driver.

#### `GET /api/v1/bookings/ride/:rideId`
Retrieves bookings for a specific ride.
- **Access:** Authenticated (Owner Driver only). Other users receive `403 FORBIDDEN`.

#### `GET /api/v1/bookings/:id`
Retrieves a single booking. Accessible only to the passenger who booked or the driver who offered the ride.

#### `POST /api/v1/bookings/:id/confirm`
Driver accepts a pending booking request.
- **Concurrency & Locking:** Uses `SELECT ... FOR UPDATE` row locks on both `bookings` and `rides`.
- Atomically decrements `available_seats`. If seats reach 0, ride status becomes `FULL`.
- Rejects with `409 INSUFFICIENT_SEATS` if capacity was exhausted by concurrent confirmations.

#### `POST /api/v1/bookings/:id/reject`
Driver rejects a pending booking request (`status = 'REJECTED'`).

#### `POST /api/v1/bookings/:id/cancel`
Passenger or driver cancels a booking.
- If the booking was `CONFIRMED`, allocated seats are restored back to the ride using `LEAST(total_seats, available_seats + ?)` exactly once.
- If the booking was `PENDING`, no seats were held, so none are released.
