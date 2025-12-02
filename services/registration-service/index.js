require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initDatabase, getPool } = require('../../shared/db/config');

const app = express();
const PORT = process.env.PORT || 3003;

// Initialize database
initDatabase();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  })
);

// Routes
app.get('/health', async (req, res) => {
  try {
    // Ping database to ensure connection is healthy
    const pool = getPool();
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', service: 'registration-service' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Import routes
const registrationRoutes = require('./routes/registrationRoutes');
app.use('/api/registrations', registrationRoutes);

const waitlistRoutes = require('./routes/waitlistRoutes');
app.use('/api/waitlist', waitlistRoutes);

const passportRoutes = require('./routes/passportRoutes');
app.use('/api/passport', passportRoutes);

const checkinRoutes = require('./routes/checkinRoutes');
app.use('/api/checkin', checkinRoutes); // FR-18

app.listen(PORT, () => {
  console.log(`Registration Service running on port ${PORT}`);
});

