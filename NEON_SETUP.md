# Neon Database Setup Guide

This guide explains how to configure EventSphere to use Neon (cloud PostgreSQL database) instead of a local database.

## Quick Setup

### 1. Get Your Neon Connection String

1. Log in to your [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to **Connection Details**
4. Copy the **Connection String** (it will look like):
   ```
   postgresql://username:password@ep-xxx-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Update Environment Variables

Update the `DATABASE_URL` in all `.env` files with your Neon connection string:

#### Root `.env` file:
```env
DATABASE_URL=postgresql://neondb_owner:your-password@ep-xxx-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DB_SSL=true
```

#### Service `.env` files:
Update `DATABASE_URL` and set `DB_SSL=true` in:
- `services/user-service/.env`
- `services/event-service/.env`
- `services/registration-service/.env`
- `services/notification-service/.env`

**Important Notes:**
- Neon requires SSL, so always set `DB_SSL=true`
- Use the **pooler** connection string for better performance
- The connection string already includes `?sslmode=require`, which is correct

### 3. Initialize Database Schema

Run the database initialization script on your Neon database:

```bash
# Option 1: Using psql (if installed)
psql "your-neon-connection-string" -f database/init.sql

# Option 2: Using Neon SQL Editor
# Copy the contents of database/init.sql and run it in the Neon SQL Editor
```

### 4. Verify Connection

Test the connection by starting a service:

```bash
cd services/user-service
npm install
node index.js
```

You should see: `User Service running on port 3001` without database connection errors.

## Connection String Format

Neon provides connection strings in this format:
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

For the `DATABASE_URL` environment variable, use it exactly as provided by Neon.

## SSL Configuration

Neon requires SSL connections. The configuration is handled automatically:

- `DB_SSL=true` enables SSL with `rejectUnauthorized: false` (required for Neon)
- The connection string includes `?sslmode=require` which is compatible

## Using Pooler vs Direct Connection

Neon offers two connection types:

1. **Pooler** (Recommended): Better for serverless/server environments
   - Format: `ep-xxx-xxx-pooler.us-east-1.aws.neon.tech`
   - Handles connection pooling automatically
   - Use this for production deployments

2. **Direct**: Direct database connection
   - Format: `ep-xxx-xxx.us-east-1.aws.neon.tech`
   - Lower latency but fewer concurrent connections
   - Use for local development if needed

## Environment Variables for Neon

### Required:
```env
DATABASE_URL=postgresql://user:password@ep-xxx-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DB_SSL=true
```

### Optional (but recommended):
```env
JWT_SECRET=your-strong-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://yourdomain.com
```

## Troubleshooting

### Connection Timeout
- Check that your IP is allowed (Neon allows all IPs by default)
- Verify the connection string is correct
- Ensure `DB_SSL=true` is set

### SSL Certificate Error
- Make sure `DB_SSL=true` is set in all service `.env` files
- The code uses `rejectUnauthorized: false` which is required for Neon

### Authentication Failed
- Verify username and password in the connection string
- Check that the database name matches your Neon database name
- Ensure you're using the correct project's connection string

### Schema Not Found
- Run `database/init.sql` on your Neon database
- Check that tables exist using Neon SQL Editor

## Production Deployment

For production with Neon:

1. **Use Environment Variables**: Set `DATABASE_URL` in your deployment platform (Render, Vercel, etc.)
2. **Never Commit Secrets**: Keep connection strings in environment variables, not in code
3. **Use Pooler**: Always use the pooler connection string for production
4. **Monitor Connections**: Neon dashboard shows connection metrics

## Example .env File for Neon

```env
# Database Configuration (Neon)
DATABASE_URL=postgresql://neondb_owner:your-password@ep-dark-sea-a4blp8e6-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DB_SSL=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Service URLs
NOTIFICATION_SERVICE_URL=https://notification-service.onrender.com
REGISTRATION_SERVICE_URL=https://registration-service.onrender.com
```

## Switching Between Local and Neon

To switch between local PostgreSQL and Neon:

1. **Local Development**: Use local connection string
   ```env
   DATABASE_URL=postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
   DB_SSL=false
   ```

2. **Neon (Production)**: Use Neon connection string
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   DB_SSL=true
   ```

You can maintain separate `.env` files or use different environment variable sets for different environments.

