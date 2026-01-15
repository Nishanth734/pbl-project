const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Import routes
const providerRoutes = require('./routes/providers');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Home Services API is running',
        timestamp: new Date().toISOString()
    });
});

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/provider-register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/provider-register.html'));
});


app.get('/bookings', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/bookings.html'));
});

app.get('/provider-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/provider-dashboard.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
  🏠 Home Services Platform
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server running on port ${PORT}
  📡 API: http://localhost:${PORT}/api
  🌐 App: http://localhost:${PORT}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
