const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/home-services', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// API Routes
const providerRoutes = require('./routes/providers');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const chatRoutes = require('./routes/chat');

app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);

// Page Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/bookings', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/bookings.html'));
});

app.get('/provider-register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/provider-register.html'));
});

app.get('/provider-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/provider-dashboard.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/chat.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
