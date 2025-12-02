require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('../../shared/db/config');
const eventService = require('./services/eventService');

const app = express();
const PORT = process.env.PORT || 3002;

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
  res.json({ status: 'ok', service: 'event-service' });
});

// Archive past events endpoint (for manual trigger or scheduled job)
app.post('/archive-past-events', async (req, res) => {
  try {
    const archived = await eventService.archivePastEvents();
    res.json({
      message: 'Past events archived successfully',
      archivedCount: archived.length,
      archivedEvents: archived
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import routes
const eventRoutes = require('./routes/eventRoutes');
app.use('/api/events', eventRoutes);

app.listen(PORT, () => {
  console.log(`Event Service running on port ${PORT}`);
  
  // Optional: Set up automatic archiving on service start
  // In production, you might want to use a cron job or scheduled task
  // For now, we'll archive on service start and then every hour
  if (process.env.ENABLE_AUTO_ARCHIVE !== 'false') {
    // Archive immediately on start
    eventService.archivePastEvents()
      .then(archived => {
        if (archived.length > 0) {
          console.log(`Archived ${archived.length} past event(s) on service start`);
        }
      })
      .catch(err => {
        console.error('Error archiving past events on start:', err);
      });

    // Archive every hour
    setInterval(() => {
      eventService.archivePastEvents()
        .then(archived => {
          if (archived.length > 0) {
            console.log(`Archived ${archived.length} past event(s)`);
          }
        })
        .catch(err => {
          console.error('Error archiving past events:', err);
        });
    }, 60 * 60 * 1000); // 1 hour in milliseconds
  }
});
