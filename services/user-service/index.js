require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('../../shared/db/config');

const app = express();
const PORT = process.env.PORT || 3001;

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
  res.json({ status: 'ok', service: 'user-service' });
});

// Import routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

