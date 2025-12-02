# Neon Database - Quick Start

## What to Change for Neon

### 1. Update All `.env` Files

Update `DATABASE_URL` and `DB_SSL` in these files:
- `.env` (root)
- `services/user-service/.env`
- `services/event-service/.env`
- `services/registration-service/.env`
- `services/notification-service/.env`

**Change from:**
```env
DATABASE_URL=postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
DB_SSL=false
```

**Change to:**
```env
DATABASE_URL=postgresql://neondb_owner:npg_qur8Y3bhCFNO@ep-dark-sea-a4blp8e6-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DB_SSL=true
```

**Replace with your actual Neon connection string!**

### 2. Initialize Database Schema

Run the schema initialization on your Neon database:

**Option A: Using Neon SQL Editor**
1. Go to [Neon Console](https://console.neon.tech)
2. Open your project
3. Click on **SQL Editor**
4. Copy contents of `database/init.sql`
5. Paste and execute in SQL Editor

**Option B: Using psql**
```bash
psql "your-neon-connection-string" -f database/init.sql
```

### 3. Verify Connection

Start a service to test:
```bash
cd services/user-service
node index.js
```

Should see: `User Service running on port 3001` (no errors)

## Your Neon Connection String

Based on your docker-compose.yml, your connection string is:
```
postgresql://neondb_owner:npg_qur8Y3bhCFNO@ep-dark-sea-a4blp8e6-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Important:** 
- Keep this secure (don't commit to git)
- Use the same connection string in all service `.env` files
- Always set `DB_SSL=true` for Neon

## Files That Need Updates

✅ **Already configured correctly:**
- `shared/db/config.js` - Uses DATABASE_URL and handles SSL
- `docker-compose.yml` - Uses environment variables

📝 **You need to update:**
- All `.env` files (root + all services)
- Run database schema initialization

## Next Steps

1. Update all `.env` files with your Neon connection string
2. Set `DB_SSL=true` in all `.env` files
3. Initialize database schema (see step 2 above)
4. Test connection by starting a service
5. Deploy services with the same environment variables

For detailed instructions, see [NEON_SETUP.md](./NEON_SETUP.md)

