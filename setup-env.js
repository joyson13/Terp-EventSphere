#!/usr/bin/env node

/**
 * Setup script to create .env files for all services
 * Run: node setup-env.js
 */

const fs = require('fs');
const path = require('path');

const envTemplates = {
  root: {
    file: '.env',
    content: `# Root Environment Variables
# Database Configuration
# For local development: postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
# For Neon: Use your Neon connection string from console.neon.tech
DATABASE_URL=postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
DB_SSL=false

# JWT Configuration
JWT_SECRET=dev-jwt-secret-key-change-in-production-min-32-chars
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
`
  },
  'user-service': {
    file: 'services/user-service/.env',
    content: `# User Service Environment Variables
# For Neon: Update DATABASE_URL with your Neon connection string and set DB_SSL=true
DATABASE_URL=postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
DB_SSL=false
JWT_SECRET=dev-jwt-secret-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
PORT=3001
`
  },
  'event-service': {
    file: 'services/event-service/.env',
    content: `# Event Service Environment Variables
# For Neon: Update DATABASE_URL with your Neon connection string and set DB_SSL=true
DATABASE_URL=postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
DB_SSL=false
JWT_SECRET=dev-jwt-secret-key-change-in-production-min-32-chars
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
NOTIFICATION_SERVICE_URL=http://localhost:3004
PORT=3002
ENABLE_AUTO_ARCHIVE=true
`
  },
  'registration-service': {
    file: 'services/registration-service/.env',
    content: `# Registration Service Environment Variables
# For Neon: Update DATABASE_URL with your Neon connection string and set DB_SSL=true
DATABASE_URL=postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
DB_SSL=false
JWT_SECRET=dev-jwt-secret-key-change-in-production-min-32-chars
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
NOTIFICATION_SERVICE_URL=http://localhost:3004
PORT=3003
`
  },
  'notification-service': {
    file: 'services/notification-service/.env',
    content: `# Notification Service Environment Variables
# For Neon: Update DATABASE_URL with your Neon connection string and set DB_SSL=true
DATABASE_URL=postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere
DB_SSL=false
JWT_SECRET=dev-jwt-secret-key-change-in-production-min-32-chars
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173
PORT=3004
`
  },
  frontend: {
    file: 'frontend/.env',
    content: `# Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:3001
VITE_USER_SERVICE_URL=http://localhost:3001
VITE_EVENT_SERVICE_URL=http://localhost:3002
VITE_REGISTRATION_SERVICE_URL=http://localhost:3003
VITE_NOTIFICATION_SERVICE_URL=http://localhost:3004
`
  }
};

function createEnvFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Check if file already exists
  if (fs.existsSync(fullPath)) {
    console.log(`⚠️  ${filePath} already exists. Skipping...`);
    return false;
  }
  
  // Write file
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Created ${filePath}`);
  return true;
}

console.log('🚀 Setting up environment variables...\n');

let created = 0;
let skipped = 0;

for (const [name, config] of Object.entries(envTemplates)) {
  if (createEnvFile(config.file, config.content)) {
    created++;
  } else {
    skipped++;
  }
}

console.log(`\n✨ Setup complete!`);
console.log(`   Created: ${created} files`);
console.log(`   Skipped: ${skipped} files (already exist)`);
console.log(`\n⚠️  IMPORTANT:`);
console.log(`   1. Update JWT_SECRET in all .env files with a strong random string for production!`);
console.log(`   2. For Neon database: Update DATABASE_URL with your Neon connection string and set DB_SSL=true`);
console.log(`   3. See NEON_SETUP.md for detailed Neon configuration instructions`);

