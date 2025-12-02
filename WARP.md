# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Terp EventSphere is a microservices-based event management system for university events. The architecture splits functionality across independent services that communicate via HTTP APIs and WebSockets.

**Tech Stack**: Node.js/Express backend services, React/Vite frontend, PostgreSQL (NeonDB), Socket.IO for real-time notifications

## Development Commands

### Environment Setup
```powershell
# First-time setup: Install all dependencies
npm install

# Create environment files for all services
node setup-env.js

# Update DATABASE_URL in all .env files with NeonDB connection string
# Set DB_SSL=true for NeonDB
```

### Database Setup
```powershell
# Initialize database schema on NeonDB
psql "your-neon-connection-string" -f database/init.sql

# Or copy contents of database/init.sql and run in Neon SQL Editor
```

### Running Services
```powershell
# Run all services (frontend + 4 backend services)
npm run dev

# Run only backend services (no frontend)
npm run dev:services

# Run individual service in development mode
npm run dev --workspace=@terp-eventsphere/user-service
npm run dev --workspace=@terp-eventsphere/event-service
npm run dev --workspace=@terp-eventsphere/registration-service
npm run dev --workspace=@terp-eventsphere/notification-service
npm run dev --workspace=@terp-eventsphere/frontend

# Or navigate to service directory and run
cd services/user-service
npm run dev
```

### Service Ports
- User Service: 3001
- Event Service: 3002
- Registration Service: 3003
- Notification Service: 3004 (HTTP + WebSocket)
- Frontend: 5173 (Vite dev server)

### Testing
There is no test infrastructure set up yet. When adding tests, follow Node.js best practices and document the test commands here.

## Architecture

### Microservices Pattern
Each service is independent with its own routes and business logic but shares a common database. Services communicate via:
- **HTTP APIs**: For synchronous operations
- **WebSockets**: For real-time notifications (notification service)
- **Shared Database**: All services connect to the same PostgreSQL database

### Service Responsibilities
- **user-service**: Authentication (JWT), user management, password reset
- **event-service**: Event CRUD, publishing/cancellation, participant registration
- **registration-service**: Registration and waitlist management
- **notification-service**: Real-time WebSocket notifications + in-app notification storage
- **frontend**: React SPA with authentication, event browsing, registration flows

### Layered Architecture (Backend Services)
Each backend service follows a strict 3-layer pattern:

**Controller Layer** (`controllers/`)
- Handles HTTP request/response
- Input validation
- Error handling
- Calls service layer methods
- Example: `eventController.js` handles route logic

**Service Layer** (`services/`)
- Contains business logic
- Orchestrates multiple repositories
- Handles inter-service communication
- Enforces business rules and validation
- Example: `eventService.js` validates ownership before updates

**Repository Layer** (`repositories/`)
- Direct database access using raw SQL with `pg` library
- No business logic
- CRUD operations only
- Uses soft deletes (sets `deleted_at` timestamp)
- Example: `eventRepository.js` manages database queries

**When making changes**: Always respect this layering. Controllers should never call repositories directly - use the service layer.

### Database Design
PostgreSQL with class table inheritance pattern:
- **users** table: Base table for all user types
- **participants**, **event_organizers**, **administrators**: Child tables referencing users
- All tables support soft deletes via `deleted_at` column
- Uses UUID primary keys (uuid-ossp extension)
- Connection managed by `shared/db/config.js` with pooling

### Authentication & Authorization
JWT-based authentication implemented in user-service:
- **Authentication middleware**: `services/user-service/middleware/authMiddleware.js` exports `authenticate` function
- **Admin middleware**: `services/user-service/middleware/adminMiddleware.js` exports `requireAdmin` function
- **Usage in other services**: Import and use these middleware to protect routes

```javascript
const { authenticate } = require('../../services/user-service/middleware/authMiddleware');
const { requireAdmin } = require('../../services/user-service/middleware/adminMiddleware');

// Protected route
router.get('/protected', authenticate, controller.method);

// Admin-only route
router.delete('/admin/users/:id', authenticate, requireAdmin, controller.method);
```

After authentication, `req.user` contains: `{ userID, role, email, name }`

### Inter-Service Communication
Services interact via HTTP and a shared notification client:

**Notification Client** (`shared/services/notificationClient.js`)
- Used by services to create in-app notifications
- Directly inserts into `notifications` table
- Sends WebSocket broadcasts to notification service
- Non-blocking: failures don't stop operations

```javascript
const notificationClient = require('../../../shared/services/notificationClient');

// Single notification
await notificationClient.createNotification({
  user_id: userId,
  type: 'event_cancelled',
  title: 'Event Cancelled',
  message: 'Your event has been cancelled',
  event_id: eventId
});

// Multiple users
await notificationClient.createNotificationsForUsers([userId1, userId2], {
  type: 'event_updated',
  title: 'Event Updated',
  message: 'Event details changed',
  event_id: eventId
});
```

### Frontend Architecture
React SPA using Vite:
- **Routing**: react-router-dom with protected routes
- **State Management**: React Context (AuthContext, NotificationContext)
- **API Client**: Axios-based client in `services/api.js`
- **Real-time**: Socket.IO client for WebSocket notifications
- **Styling**: TailwindCSS with custom components
- **Components**: Reusable UI components in `components/`
- **Pages**: Route components in `pages/`

## Environment Configuration

### Required Environment Variables
Each service needs its own `.env` file. Use `node setup-env.js` to generate templates.

**Backend Services (.env pattern)**:
```env
DATABASE_URL=postgresql://neondb_owner:password@host/neondb?sslmode=require
DB_SSL=true
JWT_SECRET=your-strong-secret-min-32-chars
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
PORT=3001  # varies per service
NOTIFICATION_SERVICE_URL=http://localhost:3004  # for services that create notifications
```

**Frontend (.env)**:
```env
VITE_USER_SERVICE_URL=http://localhost:3001
VITE_EVENT_SERVICE_URL=http://localhost:3002
VITE_REGISTRATION_SERVICE_URL=http://localhost:3003
VITE_NOTIFICATION_SERVICE_URL=http://localhost:3004
```

**IMPORTANT**: 
- NeonDB requires `DB_SSL=true`
- JWT_SECRET must be identical across all backend services
- Never commit `.env` files

## Database Operations

### Schema Management
The project uses a single initialization script (`database/init.sql`) rather than migrations:
- Run on fresh database to create all tables and indexes
- Updates require manual SQL execution
- No migration tooling currently exists

### Soft Deletes
All tables use soft delete pattern:
- Set `deleted_at = CURRENT_TIMESTAMP` instead of DELETE
- All queries filter `WHERE deleted_at IS NULL`
- Repositories have `softDelete()` methods

### Connection Pool
Database configuration in `shared/db/config.js`:
- Singleton pool pattern (initialized once per service)
- SSL support for cloud databases
- Connection pooling with 20 max connections
- Services call `initDatabase()` on startup

## Common Patterns

### Adding a New Endpoint
1. Add route in `routes/` directory
2. Create controller method in `controllers/`
3. Implement business logic in `services/`
4. Add database access in `repositories/`
5. Add authentication middleware if needed

### Creating a New Service
1. Create directory in `services/`
2. Set up layered structure: `controllers/`, `services/`, `repositories/`, `routes/`
3. Add `package.json` with workspace name `@terp-eventsphere/service-name`
4. Add to root `package.json` workspaces array
5. Create `.env.example` file
6. Add to `npm run dev` concurrently command

### Handling Notifications
Use `notificationClient` for all in-app notifications. Don't directly send emails - that's future work. Current pattern:
```javascript
// Fire-and-forget: don't block operations
notificationClient.createNotification(data)
  .catch(err => console.error('Notification failed:', err));
```

### Event Status Transitions
Events follow a state machine:
- **draft** → **published**: Via `publishEvent()` endpoint
- **published** → **cancelled**: Via `cancelEvent()` endpoint  
- **published** → **completed**: Automatic (background job checks `start_time < now`)

Auto-archiving is controlled by `ENABLE_AUTO_ARCHIVE=true` in event-service `.env`

## Known Patterns & Conventions

### API Response Patterns
- Success: Return entity or `{ message, data }`
- Error: Return `{ error: "message" }` with appropriate status code
- 401: Authentication required
- 403: Forbidden (authenticated but not authorized)
- 404: Resource not found
- 400: Bad request/validation error
- 500: Server error

### Date Handling
- Backend stores in PostgreSQL `TIMESTAMP` (no timezone)
- Frontend handles timezone conversion in `utils/timezone.js`
- API expects ISO 8601 strings

### Password Security
- bcrypt hashing in user-service
- Minimum complexity: enforced client-side only (add server-side validation if needed)
- Password reset via time-limited tokens (UUID in `password_reset_tokens` table)

### CORS Configuration
- Configured per-service via `CORS_ORIGIN` environment variable
- Supports multiple origins (comma-separated)
- Credentials enabled for cookie-based auth (though currently using JWT in headers)

## Windows Development Notes

This codebase is developed on Windows. PowerShell-specific patterns:
- Use `Get-ChildItem` instead of `ls`
- Path separators: Use `\\` in Windows paths or forward slashes in cross-platform code
- Line endings: Files use CRLF (`\r\n`)

When writing shell commands, prefer PowerShell syntax or use cross-platform Node.js scripts.
