-- Migration 005: Create bookings table for passenger seat requests and management
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY,
  ride_id VARCHAR(36) NOT NULL,
  passenger_id VARCHAR(36) NOT NULL,
  seats_booked TINYINT UNSIGNED NOT NULL DEFAULT 1,
  price_per_seat DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_ride FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_passenger FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_bookings_ride (ride_id, status),
  INDEX idx_bookings_passenger (passenger_id, status),
  INDEX idx_bookings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
