require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const port = process.env.PORT || 3004;

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => res.json({ status: 'ok', service: 'notification-service' }));

app.listen(port, () => console.log(`Notification service running on port ${port}`));

module.exports = app;