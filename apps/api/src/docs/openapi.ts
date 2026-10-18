export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'RideMitra REST API',
    version: '0.1.0',
    description:
      'Production-minded carpooling and bikepooling REST API connecting drivers and passengers for city commutes and intercity travel across India.',
    contact: {
      name: 'RideMitra Engineering Team',
      url: 'https://github.com/priyank-danavle/RideMitra',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base Endpoint',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'ridemitra_token',
        description: 'HTTP-only secure JWT session cookie issued on login/registration.',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization Bearer token header alternative.',
      },
    },
    schemas: {
      UserSafeProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
          name: { type: 'string', example: 'Pooja Sharma' },
          email: { type: 'string', format: 'email', example: 'pooja.sharma@example.com' },
          phone: { type: 'string', nullable: true, example: '+919876543210' },
          bio: { type: 'string', nullable: true, example: 'Daily commuter between Gandhinagar and Ahmedabad.' },
          role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
          isEmailVerified: { type: 'boolean', example: false },
          isPhoneVerified: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'd3b07384-d113-46fb-9c5e-8e65e6833c94' },
          userId: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['CAR', 'BIKE'], example: 'CAR' },
          make: { type: 'string', example: 'Tata' },
          model: { type: 'string', example: 'Nexon EV' },
          year: { type: 'integer', example: 2023 },
          color: { type: 'string', example: 'Calgary White' },
          registrationNumber: { type: 'string', example: 'GJ-01-AB-1234' },
          capacity: { type: 'integer', minimum: 1, maximum: 8, example: 4 },
          isVerified: { type: 'boolean', example: false },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Ride: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          driverId: { type: 'string', format: 'uuid' },
          vehicleId: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['CITY', 'INTERCITY'], example: 'INTERCITY' },
          origin: { type: 'string', example: 'Ahmedabad' },
          destination: { type: 'string', example: 'Surat' },
          pickupPoint: { type: 'string', nullable: true, example: 'Iskcon Cross Roads' },
          dropoffPoint: { type: 'string', nullable: true, example: 'Majura Gate' },
          departureTime: { type: 'string', format: 'date-time', example: '2026-10-25T08:30:00.000Z' },
          totalSeats: { type: 'integer', minimum: 1, maximum: 8, example: 4 },
          availableSeats: { type: 'integer', minimum: 0, maximum: 8, example: 3 },
          pricePerSeat: { type: 'number', minimum: 0, example: 350 },
          description: { type: 'string', nullable: true, example: 'Smooth AC ride, strictly non-smoking.' },
          status: { type: 'string', enum: ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'], example: 'SCHEDULED' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          driver: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'Arjun Mehta' },
              bio: { type: 'string', nullable: true },
              isVerified: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          vehicle: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              type: { type: 'string', enum: ['CAR', 'BIKE'], example: 'CAR' },
              make: { type: 'string', example: 'Tata' },
              model: { type: 'string', example: 'Safari' },
              year: { type: 'integer', example: 2023 },
              color: { type: 'string', example: 'Starlight Black' },
              capacity: { type: 'integer', example: 6 },
              registrationNumber: { type: 'string', example: 'GJ-01-BK-9999' },
            },
          },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          rideId: { type: 'string', format: 'uuid' },
          passengerId: { type: 'string', format: 'uuid' },
          seatsBooked: { type: 'integer', minimum: 1, maximum: 8, example: 1 },
          pricePerSeat: { type: 'number', example: 350 },
          totalPrice: { type: 'number', example: 350 },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
            example: 'PENDING',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          passenger: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'Bhavik Patel' },
              bio: { type: 'string', nullable: true },
              isVerified: { type: 'boolean', example: false },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          ride: {
            type: 'object',
            description: 'Embedded ride summary for passenger itinerary view',
          },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string', example: 'Operation completed successfully.' },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid request payload' },
              details: { type: 'object' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Liveness Probe',
        description: 'Returns 200 OK when the Node.js API process is responsive.',
        tags: ['Health'],
        responses: {
          '200': {
            description: 'API server is running',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/ready': {
      get: {
        summary: 'Readiness Probe',
        description: 'Verifies MySQL database connectivity and system subsystems.',
        tags: ['Health'],
        responses: {
          '200': {
            description: 'All subsystems and database are ready',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
          '503': {
            description: 'Database unreachable or service degraded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register New User',
        description: 'Registers a new user, hashes password with bcrypt, and sets secure session cookie.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 100, example: 'Rohan Shah' },
                  email: { type: 'string', format: 'email', example: 'rohan.shah@example.com' },
                  password: { type: 'string', minLength: 8, maxLength: 100, example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Account registered and authenticated' },
          '400': { description: 'Validation error (weak password, invalid email format)' },
          '409': { description: 'Account with email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User Login',
        description: 'Authenticates credentials, generates active database session, and sets cookie.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'rohan.shah@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful' },
          '400': { description: 'Validation error' },
          '401': { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'User Logout',
        description: 'Revokes the active session token in the database and clears the session cookie.',
        tags: ['Authentication'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out successfully' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Current Session User Profile',
        description: 'Returns safe profile of currently authenticated user session.',
        tags: ['Authentication'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          '200': { description: 'Authenticated profile' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/users/profile': {
      get: {
        summary: 'Get User Profile',
        description: 'Retrieves profile for the logged in user.',
        tags: ['Users'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          '200': { description: 'User profile retrieved' },
          '401': { description: 'Unauthorized' },
        },
      },
      patch: {
        summary: 'Update User Profile',
        description: 'Updates allowed profile fields (name, phone, bio) with mass-assignment protection.',
        tags: ['Users'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 100 },
                  phone: { type: 'string', pattern: '^(\\+91[-\\s]?)?[6-9]\\d{9}$', example: '+919876543210' },
                  bio: { type: 'string', maxLength: 500, example: 'Software engineer commuting to GIFT City.' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
          '400': { description: 'Validation error or forbidden fields modified' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/vehicles': {
      post: {
        summary: 'Register Vehicle',
        description: 'Registers a new CAR or BIKE for the authenticated user.',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'make', 'model', 'year', 'color', 'registrationNumber', 'capacity'],
                properties: {
                  type: { type: 'string', enum: ['CAR', 'BIKE'], example: 'CAR' },
                  make: { type: 'string', example: 'Tata' },
                  model: { type: 'string', example: 'Harrier' },
                  year: { type: 'integer', example: 2023 },
                  color: { type: 'string', example: 'Oberon Black' },
                  registrationNumber: { type: 'string', example: 'GJ-01-AB-1234' },
                  capacity: { type: 'integer', example: 4, description: '1 for BIKE; 1-8 for CAR' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Vehicle registered successfully' },
          '400': { description: 'Validation error (capacity violation, invalid reg format)' },
          '401': { description: 'Unauthorized' },
          '409': { description: 'Registration number already exists' },
        },
      },
      get: {
        summary: 'List User Vehicles',
        description: 'Lists all active registered vehicles owned by the authenticated user.',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          '200': { description: 'List of vehicles' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/vehicles/{id}': {
      get: {
        summary: 'Get Vehicle by ID',
        description: 'Retrieves vehicle details verifying owner access.',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Vehicle details' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Vehicle not found or does not belong to caller' },
        },
      },
      patch: {
        summary: 'Update Vehicle Details',
        description: 'Updates allowed vehicle properties (make, model, year, color, capacity).',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  make: { type: 'string' },
                  model: { type: 'string' },
                  year: { type: 'integer' },
                  color: { type: 'string' },
                  capacity: { type: 'integer', minimum: 1, maximum: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Vehicle updated' },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Vehicle not found' },
        },
      },
      delete: {
        summary: 'Deactivate Vehicle',
        description: 'Soft-deletes a vehicle owned by the user (sets is_active = FALSE).',
        tags: ['Vehicles'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Vehicle deactivated' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Vehicle not found' },
        },
      },
    },
    '/rides': {
      post: {
        summary: 'Offer a Ride',
        description: 'Publishes a new carpool or bikepool ride after verifying active vehicle ownership and departure schedule.',
        tags: ['Rides'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vehicleId', 'type', 'origin', 'destination', 'departureTime', 'availableSeats'],
                properties: {
                  vehicleId: { type: 'string', format: 'uuid' },
                  type: { type: 'string', enum: ['CITY', 'INTERCITY'], example: 'INTERCITY' },
                  origin: { type: 'string', example: 'Ahmedabad' },
                  destination: { type: 'string', example: 'Vadodara' },
                  pickupPoint: { type: 'string', nullable: true, example: 'C.G. Road' },
                  dropoffPoint: { type: 'string', nullable: true, example: 'Akota Gardens' },
                  departureTime: { type: 'string', format: 'date-time' },
                  availableSeats: { type: 'integer', minimum: 1, maximum: 8, example: 3 },
                  pricePerSeat: { type: 'number', minimum: 0, default: 0, example: 250 },
                  description: { type: 'string', maxLength: 1000, nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Ride published' },
          '400': { description: 'Validation error, past departure time, or inactive vehicle' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Selected vehicle not found or not owned by user' },
        },
      },
      get: {
        summary: 'Search Available Rides',
        description: 'Searches published upcoming rides matching origin, destination, vehicle mode, and dates with database pagination.',
        tags: ['Rides'],
        parameters: [
          { name: 'origin', in: 'query', schema: { type: 'string' } },
          { name: 'destination', in: 'query', schema: { type: 'string' } },
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date', example: '2026-10-25' } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['CITY', 'INTERCITY'] } },
          { name: 'vehicleType', in: 'query', schema: { type: 'string', enum: ['ALL', 'CAR', 'BIKE'] } },
          { name: 'minSeats', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'minPrice', in: 'query', schema: { type: 'number', minimum: 0 } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number', minimum: 0 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['departureTime', 'price'], default: 'departureTime' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 50 } },
        ],
        responses: {
          '200': { description: 'Paginated search results' },
        },
      },
    },
    '/rides/driver/mine': {
      get: {
        summary: 'Driver Offered Rides',
        description: 'Lists all rides offered by the logged-in driver with optional status filtering.',
        tags: ['Rides'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ALL', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] } },
        ],
        responses: {
          '200': { description: 'Driver rides list' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/rides/{id}': {
      get: {
        summary: 'Ride Details',
        description: 'Returns full public details of a ride, including vehicle specs and driver profile.',
        tags: ['Rides'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Ride details' },
          '404': { description: 'Ride not found' },
        },
      },
      patch: {
        summary: 'Update Ride Details',
        description: 'Updates pickup, dropoff, price, or seats of an upcoming scheduled ride.',
        tags: ['Rides'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  pickupPoint: { type: 'string', nullable: true },
                  dropoffPoint: { type: 'string', nullable: true },
                  departureTime: { type: 'string', format: 'date-time' },
                  availableSeats: { type: 'integer', minimum: 1, maximum: 8 },
                  pricePerSeat: { type: 'number', minimum: 0 },
                  description: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Ride updated' },
          '400': { description: 'Invalid status or exceeds vehicle capacity' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Ride not found or not owned by driver' },
        },
      },
      delete: {
        summary: 'Cancel Ride',
        description: 'Cancels ride and cascades cancellation to all pending and confirmed bookings.',
        tags: ['Rides'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Ride cancelled successfully' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Ride not found' },
        },
      },
    },
    '/rides/{id}/cancel': {
      post: {
        summary: 'Cancel Ride (POST alias)',
        description: 'Convenience endpoint to cancel a ride and cascade cancellation to bookings.',
        tags: ['Rides'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Ride cancelled successfully' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Ride not found' },
        },
      },
    },
    '/bookings': {
      post: {
        summary: 'Request Ride Booking',
        description: 'Creates a pending booking request for a passenger on a scheduled ride.',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rideId', 'seatsBooked'],
                properties: {
                  rideId: { type: 'string', format: 'uuid' },
                  seatsBooked: { type: 'integer', minimum: 1, maximum: 8, default: 1 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Booking request created (PENDING)' },
          '400': { description: 'Validation error, self-booking, or non-bookable ride' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Ride not found' },
          '409': { description: 'Insufficient seats or duplicate active booking' },
        },
      },
    },
    '/bookings/passenger/mine': {
      get: {
        summary: 'Passenger Bookings',
        description: 'Lists all bookings made by the authenticated passenger.',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'] } },
        ],
        responses: {
          '200': { description: 'List of passenger bookings' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/bookings/driver/mine': {
      get: {
        summary: 'Driver Booking Requests',
        description: 'Lists booking requests across all rides offered by the authenticated driver.',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'rideId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'] } },
        ],
        responses: {
          '200': { description: 'List of driver bookings' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/bookings/ride/{rideId}': {
      get: {
        summary: 'Ride Bookings Inspection',
        description: 'Retrieves all bookings for a specific ride offered by the authenticated driver.',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'rideId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'List of bookings for the ride' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden (caller is not the driver of this ride)' },
          '404': { description: 'Ride not found' },
        },
      },
    },
    '/bookings/{id}': {
      get: {
        summary: 'Booking Details',
        description: 'Retrieves a single booking by ID (accessible by passenger or driver).',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Booking details' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden (caller is not passenger or driver)' },
          '404': { description: 'Booking not found' },
        },
      },
    },
    '/bookings/{id}/confirm': {
      post: {
        summary: 'Confirm Booking Request',
        description: 'Driver accepts a pending booking, locking the ride and atomically decrementing available seats.',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Booking confirmed (CONFIRMED)' },
          '400': { description: 'Invalid booking status or ride cancelled' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden (not driver of this ride)' },
          '404': { description: 'Booking not found' },
          '409': { description: 'Insufficient seats remaining on ride' },
        },
      },
    },
    '/bookings/{id}/reject': {
      post: {
        summary: 'Reject Booking Request',
        description: 'Driver rejects a pending booking request.',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Booking rejected (REJECTED)' },
          '400': { description: 'Invalid status (only PENDING bookings can be rejected)' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Booking not found' },
        },
      },
    },
    '/bookings/{id}/cancel': {
      post: {
        summary: 'Cancel Booking',
        description: 'Passenger or driver cancels booking. If confirmed, allocated seats are restored to the ride exactly once.',
        tags: ['Bookings'],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Booking cancelled (CANCELLED)' },
          '400': { description: 'Booking already cancelled or completed' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Booking not found' },
        },
      },
    },
  },
};
