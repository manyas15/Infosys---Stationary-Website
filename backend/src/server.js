const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
// Simple request logger to help debug 404s
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

// Serve frontend static files from the frontend folder so the UI and API share origin
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'stationery-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/transactions', transactionRoutes);

// Global 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});



