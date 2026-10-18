# RideMitra — Product Overview

## 1. Executive Summary

**RideMitra** is a modern, responsive carpooling and bikepooling web platform designed to connect drivers who have vacant seats with passengers travelling along the same route. The platform addresses urban congestion, rising fuel expenses, and limited commuter options by fostering shared mobility for both intra-city daily commutes and intercity travel corridors.

---

## 2. Problem Statement

Daily commuters and intercity travelers face recurring challenges:

- **High Solo Commute Costs:** Single-occupancy vehicles incur high fuel and toll expenses.
- **Urban Congestion & Emissions:** Dense urban corridors suffer from avoidable carbon emissions and traffic gridlock.
- **Fragmented Informal Coordination:** Commuters frequently resort to chaotic WhatsApp or Telegram groups without route discovery, transparent seat counts, or reliable scheduling.
- **Safety and Trust Gaps:** Lack of verified profiles and accountability in informal ride arrangements creates safety concerns for both vehicle owners and riders.

RideMitra provides a structured, transparent, and secure digital platform to publish, discover, and coordinate rides seamlessly across city and intercity journeys.

---

## 3. Product Scope & Core Travel Models

### 3.1 City Commuting

- **Daily Office & College Commuting:** Recurring daily commutes between major commercial, residential, and university hubs.
- **Flexible Vehicle Modes:** Support for both **Cars** (multiple seats) and **Bikes / Scooters** (single pillion rider), providing affordable micro-commute options.
- **Flexible Drop-offs:** Popular designated pickup points along standard city arterial routes.

### 3.2 Intercity Travel

- **Regional Corridors:** Scheduled long-distance rides across high-traffic routes (e.g., Surat ⇄ Ahmedabad, Vadodara ⇄ Ahmedabad, Surat ⇄ Mumbai, and regional towns).
- **Luggage & Comfort Preferences:** Transparency on available boot space, AC availability, and scheduled halts.
- **Cost-sharing Transparency:** Fair, non-commercial cost contributions calculated based on distance and fuel expenses.

---

## 4. User Roles & Personas

RideMitra operates with a unified account model: a single registered user can act as both a **Passenger** and a **Driver** depending on context.

### 4.1 Passenger

- Search for available rides matching origin, destination, date, and preferred vehicle type.
- Inspect driver profiles, vehicle details, reviews, and route waypoints.
- Submit booking requests for available seats.
- Manage existing reservations (view status, cancel eligible bookings).
- Review drivers after trip completion.

### 4.2 Driver

- Maintain verified profile information, driving license, and vehicle records.
- Create and publish upcoming rides with detailed route, departure time, seat availability, and cost contribution.
- Review and accept or reject pending seat requests from passengers.
- Update ride progress (e.g., Scheduled, In Progress, Completed, Cancelled).
- Review passengers after trip completion.

### 4.3 Administrator

- Monitor platform metrics, active rides, and user verifications.
- Review flagged accounts, dispute tickets, and safety reports.
- Enforce community guidelines, suspend fraudulent profiles, and moderate content.

---

## 5. Non-Goals & Boundaries

To preserve architectural clarity and adhere to legal ridesharing norms, RideMitra explicitly defines the following non-goals:

- **Not a Commercial Taxi Service:** RideMitra is not an on-demand commercial taxi service (like Uber or Ola). Drivers cannot operate for commercial profit; fare contributions are strictly capped cost-sharing mechanisms for fuel and maintenance.
- **No Instant On-Demand Dispatching in MVP:** Rides are pre-scheduled; the MVP does not support instant, sub-minute algorithmic taxi dispatch.
- **No In-House Fleet Management:** The platform does not own, lease, or manage vehicles.
- **No Premature Microservices:** All initial phases utilize a clean, modular monolith with distinct domain boundaries rather than premature distributed services.

---

## 6. Core Product Principles

1. **Production Mindset:** Every milestone must produce functional, tested, and maintainable software rather than cosmetic mockups.
2. **Safety by Default:** Enforce profile transparency, verification standards, and secure session management.
3. **Data Integrity & Concurrency Safety:** Seat reservations and status transitions must remain strictly consistent under high concurrency without risk of double-booking.
4. **Inclusive Commute Modes:** Equal first-class support for both two-wheelers (bikepooling) and four-wheelers (carpooling).
5. **Progressive Architecture:** Begin with a clean, decoupled TypeScript monorepo; defer complex distributed infrastructure (e.g., route optimization microservices, NoSQL event streams) until validated by product scale.
