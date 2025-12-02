require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initDatabase, getPool } = require('../../shared/db/config');

const app = express();
const PORT = process.env.PORT || 3001;

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
    res.status(200).json({ status: 'ok', service: 'user-service' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Import routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

