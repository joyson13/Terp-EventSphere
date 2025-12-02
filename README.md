# Terp EventSphere

A microservices-based event management system with React frontend, Node.js/Express backend, and PostgreSQL database.

## Architecture

This project follows a microservices architecture with the following structure:

- **Frontend**: React application
- **Backend Services**: 
  - `user-service`: User management (Participants, Event Organizers, Administrators)
  - `event-service`: Event creation and management
  - `registration-service`: Event registrations and waitlist management
- **Shared**: Common utilities and database configuration
- **Database**: PostgreSQL (NeonDB cloud database)

## Project Structure

```
Terp-EventSphere/
├── frontend/                 # React frontend
├── services/
│   ├── user-service/        # User management service
│   │   ├── controllers/     # API request handlers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Database access
│   │   └── routes/         # Express routes
│   ├── event-service/       # Event management service
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── routes/
│   └── registration-service/ # Registration & waitlist service
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       └── routes/
├── shared/                  # Shared utilities
│   └── db/                 # Database configuration
└── database/
    └── init.sql            # Database schema
```

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL 15
- **Language**: JavaScript
- **Package Manager**: npm
- **ORM**: Raw SQL with `pg` library
- **Password Hashing**: bcrypt

## Database Schema

The database implements the following entities:

- **Users** (abstract base class with inheritance):
  - `Participant`: Can register for events and collect badges
  - `EventOrganizer`: Can create and manage events
  - `Administrator`: Can manage users and events

- **Events**: Event information with capacity and status

- **Registrations**: Association between Participants and Events (with QR codes)

- **WaitlistEntries**: Association between Participants and Events (when events are full)

- **TerrapinPassport**: Passport for participants to collect badges

- **Badges**: Badges earned by participants for attending events

All tables support soft deletes (using `deleted_at` timestamp) and include `created_at` and `updated_at` timestamps.

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher recommended)
- npm
- NeonDB account (or any PostgreSQL database)

### 1. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (root, services, shared, frontend).

### 2. Set Up Environment Variables

```bash
node setup-env.js
```

This creates `.env` files for all services with default development values. See [ENV_SETUP.md](./ENV_SETUP.md) for detailed configuration.

**Important:** Update `JWT_SECRET` in all `.env` files with a strong random string for production.

### 3. Set Up Database

This project uses NeonDB (cloud PostgreSQL). See [NEON_SETUP.md](./NEON_SETUP.md) for detailed setup instructions.

**Quick Setup:**
1. Create a NeonDB account at [neon.tech](https://neon.tech)
2. Create a new project and copy your connection string
3. Update `DATABASE_URL` in all service `.env` files with your NeonDB connection string
4. Set `DB_SSL=true` in all service `.env` files
5. Run the database schema initialization:
   ```bash
   # Option 1: Using psql (if installed)
   psql "your-neon-connection-string" -f database/init.sql
   
   # Option 2: Using Neon SQL Editor
   # Copy the contents of database/init.sql and run it in the Neon SQL Editor
   ```

### 4. Start Services

Each service can be started independently:

```bash
# User Service (Port 3001)
cd services/user-service
npm run dev

# Event Service (Port 3002)
cd services/event-service
npm run dev

# Registration Service (Port 3003)
cd services/registration-service
npm run dev
```

Or start all services from the root:

```bash
npm run dev
```

## API Endpoints

### User Service (Port 3001)

#### Public Endpoints
- `POST /api/users/register` - Register a new user (FR-1)
  - Body: `{ email, password, role, name? }`
  - Returns: User object (without password)
- `POST /api/users/login` - Login user (FR-2)
  - Body: `{ email, password }`
  - Returns: `{ token, user }` (JWT token and user object)
- `POST /api/users/password-reset/request` - Request password reset token (FR-4)
  - Body: `{ email }`
  - Returns: Reset token (in production, sent via email)
- `POST /api/users/password-reset/reset` - Reset password using token (FR-4)
  - Body: `{ resetToken, newPassword }`
  - Returns: Success message

#### Protected Endpoints (Require JWT Token)
- `GET /api/users/profile` - Get authenticated user's profile (FR-3)
  - Headers: `Authorization: Bearer <token>`
- `PUT /api/users/profile` - Update authenticated user's profile (FR-3)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ name?, email? }` (role cannot be changed)

#### Admin Endpoints (Require JWT Token + Administrator Role)
- `GET /api/users/admin/users` - Get all users (FR-5)
  - Headers: `Authorization: Bearer <token>`
- `DELETE /api/users/admin/users/:id` - Delete user (soft delete) (FR-5)
  - Headers: `Authorization: Bearer <token>`

#### Legacy Endpoints
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (soft delete)

### Event Service (Port 3002)

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event (soft delete)
- `GET /api/events/:id/registrations` - Get event registrations
- `GET /api/events/:id/waitlist` - Get event waitlist

### Registration Service (Port 3003)

- `GET /api/registrations` - Get all registrations
- `GET /api/registrations/:id` - Get registration by ID
- `POST /api/registrations` - Create registration
- `PUT /api/registrations/:id` - Update registration
- `DELETE /api/registrations/:id` - Delete registration (soft delete)
- `GET /api/registrations/participant/:participantId` - Get participant registrations

- `GET /api/waitlist` - Get all waitlist entries
- `GET /api/waitlist/:id` - Get waitlist entry by ID
- `POST /api/waitlist` - Create waitlist entry
- `DELETE /api/waitlist/:id` - Delete waitlist entry (soft delete)
- `GET /api/waitlist/participant/:participantId` - Get participant waitlist entries

## Database Connection

All services use a shared database configuration located in `shared/db/config.js`. The database connection is initialized when each service starts.

## Authentication & Authorization

### JWT Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Using Authentication Middleware in Other Services

The authentication middleware can be imported and used in other services:

```javascript
const { authenticate } = require('../../services/user-service/middleware/authMiddleware');

// Protect a route
router.get('/protected', authenticate, controller.method);

// Access user info in controller
// req.user will contain: { userID, role, email, name }
```

### Admin Authorization

For admin-only endpoints, use both middleware:

```javascript
const { authenticate } = require('../../services/user-service/middleware/authMiddleware');
const { requireAdmin } = require('../../services/user-service/middleware/adminMiddleware');

router.delete('/admin/users/:id', authenticate, requireAdmin, controller.deleteUser);
```

### Environment Variables

Environment variables are required for all services. See [ENV_SETUP.md](./ENV_SETUP.md) for detailed setup instructions.

**Quick Setup:**
```bash
node setup-env.js
```

This will create `.env` files for all services with default development values.

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)
- `JWT_SECRET` - Secret key for signing JWT tokens (use a strong random string, minimum 32 characters)
- `JWT_EXPIRES_IN` - Token expiration time (default: '24h')
- `CORS_ORIGIN` - Comma-separated list of allowed origins (e.g., `http://localhost:5173,http://localhost:3000`)
- `PORT` - Service port (optional, defaults: 3001-3004 per service)

**For Production:**
- Set `DB_SSL=true` for cloud databases (Neon, Render, etc.)
- Use strong, randomly generated `JWT_SECRET` (e.g., `openssl rand -base64 32`)
- Restrict `CORS_ORIGIN` to production domains only

**Using Neon Database:**
See [NEON_SETUP.md](./NEON_SETUP.md) for detailed instructions on configuring Neon PostgreSQL database.

## Development

### Adding a New Service

1. Create a new directory in `services/`
2. Set up the layered architecture:
   - `controllers/` - Request handlers
   - `services/` - Business logic
   - `repositories/` - Database access
   - `routes/` - Express routes
3. Add the service to the root `package.json` workspaces
4. Create a `package.json` with dependencies
5. Create an `.env.example` file

### Database Migrations

The database schema is initialized via `database/init.sql`. Run this script on your NeonDB database to set up the schema. For production, consider using a proper migration system.

## License

ISC
