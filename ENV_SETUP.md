# Environment Variables Setup Guide

This guide explains how to set up environment variables for all services in the EventSphere application.

## Quick Setup

Run the setup script to automatically create all `.env` files:

```bash
node setup-env.js
```

## Manual Setup

If you prefer to set up manually, create `.env` files in the following locations with the variables listed below.

## Required Environment Variables

### Root Level (`.env`)

Used by shared configurations and can be referenced by all services.

```env
# Database Configuration
DATABASE_URL=postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
DB_SSL=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration (comma-separated list of allowed origins)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Frontend URL (for WebSocket connections in notification service)
FRONTEND_URL=http://localhost:5173

# Service URLs (for inter-service communication)
NOTIFICATION_SERVICE_URL=http://localhost:3004
REGISTRATION_SERVICE_URL=http://localhost:3003

# Event Service Options
ENABLE_AUTO_ARCHIVE=true
```

### User Service (`services/user-service/.env`)

```env
DATABASE_URL=postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
DB_SSL=true
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
PORT=3001
```

### Event Service (`services/event-service/.env`)

```env
DATABASE_URL=postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
DB_SSL=true
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
NOTIFICATION_SERVICE_URL=http://localhost:3004
PORT=3002
ENABLE_AUTO_ARCHIVE=true
```

### Registration Service (`services/registration-service/.env`)

```env
DATABASE_URL=postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
DB_SSL=true
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
NOTIFICATION_SERVICE_URL=http://localhost:3004
PORT=3003
```

### Notification Service (`services/notification-service/.env`)

```env
DATABASE_URL=postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
DB_SSL=true
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173
PORT=3004
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_USER_SERVICE_URL=http://localhost:3001
VITE_EVENT_SERVICE_URL=http://localhost:3002
VITE_REGISTRATION_SERVICE_URL=http://localhost:3003
VITE_NOTIFICATION_SERVICE_URL=http://localhost:3004
```

## Environment Variable Descriptions

### Database Variables

- **DATABASE_URL**: PostgreSQL connection string in the format: `postgresql://user:password@host:port/database`
  - For local development: `postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere`
  - For production: Use your production database URL
- **DB_SSL**: Set to `"true"` if your database requires SSL (typically for cloud databases like Render, Neon, etc.)

### JWT Variables

- **JWT_SECRET**: Secret key for signing and verifying JWT tokens. **MUST be changed in production!** Use a strong random string (minimum 32 characters).
- **JWT_EXPIRES_IN**: Token expiration time (default: `24h`). Examples: `1h`, `7d`, `30d`

### CORS Variables

- **CORS_ORIGIN**: Comma-separated list of allowed origins for CORS
  - Local development: `http://localhost:5173,http://localhost:3000`
  - Production: `https://yourdomain.com,https://www.yourdomain.com`

### Service URLs

- **FRONTEND_URL**: Frontend URL for WebSocket connections (notification service)
- **NOTIFICATION_SERVICE_URL**: URL of the notification service (for inter-service communication)
- **REGISTRATION_SERVICE_URL**: URL of the registration service (for inter-service communication)

### Service Ports

- **PORT**: Port number for each service (optional, defaults provided):
  - User Service: `3001`
  - Event Service: `3002`
  - Registration Service: `3003`
  - Notification Service: `3004`

### Other Variables

- **ENABLE_AUTO_ARCHIVE**: Set to `"true"` to enable automatic archiving of past events (event service)

## Production Deployment

For production deployment, update the following:

1. **DATABASE_URL**: Use your production database connection string
2. **DB_SSL**: Set to `"true"` for cloud databases
3. **JWT_SECRET**: Generate a strong random secret (use `openssl rand -base64 32`)
4. **CORS_ORIGIN**: Set to your production frontend URL(s)
5. **FRONTEND_URL**: Set to your production frontend URL
6. **Service URLs**: Update to production URLs if services are deployed separately

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env` files to version control (they are in `.gitignore`)
- Use different `JWT_SECRET` values for development and production
- Use strong, randomly generated secrets for production
- Restrict `CORS_ORIGIN` to only your production domains

## Verifying Setup

After setting up environment variables, verify each service can start:

```bash
# User Service
cd services/user-service
npm install
node index.js

# Event Service
cd services/event-service
npm install
node index.js

# Registration Service
cd services/registration-service
npm install
node index.js

# Notification Service
cd services/notification-service
npm install
node index.js
```

Each service should start without errors and be able to connect to the database.

