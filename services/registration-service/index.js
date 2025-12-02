require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('../../shared/db/config');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'registration-service' });
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

