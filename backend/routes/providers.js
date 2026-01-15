const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');

// Service categories
const SERVICE_CATEGORIES = [
    { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
    { id: 'electrical', name: 'Electrical', icon: '⚡' },
    { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
    { id: 'painting', name: 'Painting', icon: '🎨' },
    { id: 'carpentry', name: 'Carpentry', icon: '🪚' },
    { id: 'appliance-repair', name: 'Appliance Repair', icon: '🔌' },
    { id: 'gardening', name: 'Gardening', icon: '🌱' },
    { id: 'pest-control', name: 'Pest Control', icon: '🐛' },
    { id: 'moving', name: 'Moving & Packing', icon: '📦' },
    { id: 'handyman', name: 'Handyman', icon: '🛠️' }
];

// GET categories
router.get('/categories', (req, res) => {
    res.json({ success: true, data: SERVICE_CATEGORIES });
});

// POST register provider
router.post('/register', async (req, res) => {
    try {
        const { name, phone, services, price, address, latitude, longitude } = req.body;

        // Handle both array and single service
        let servicesList = services;
        if (typeof services === 'string') {
            servicesList = [services];
        }

        if (!name || !phone || !servicesList || servicesList.length === 0 || !price || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'All fields required. Select at least one service.'
            });
        }

        const existingProvider = await Provider.findOne({ phone });
        if (existingProvider) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already registered'
            });
        }

        const provider = await Provider.create({
            name,
            phone,
            services: servicesList,
            price: parseFloat(price),
            address: address || 'Location via GPS',
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            }
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: provider
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET nearby providers
router.get('/nearby', async (req, res) => {
    try {
        const { latitude, longitude, maxDistance, service } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude required'
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const maxDist = parseInt(maxDistance) || 25;

        let pipeline = [
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: [lng, lat] },
                    distanceField: 'distance',
                    maxDistance: maxDist * 1000,
                    spherical: true
                }
            },
            { $match: { isActive: true } }
        ];

        // Filter by service if provided
        if (service && service !== 'all') {
            pipeline.push({ $match: { services: service } });
        }

        pipeline.push({ $sort: { distance: 1 } });
        pipeline.push({ $limit: 50 });

        const providers = await Provider.aggregate(pipeline);

        const providersWithDistance = providers.map(p => ({
            ...p,
            distanceKm: (p.distance / 1000).toFixed(1)
        }));

        res.json({
            success: true,
            count: providersWithDistance.length,
            data: providersWithDistance
        });
    } catch (error) {
        console.error('Nearby search error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET provider by phone (for dashboard login)
router.get('/dashboard/:phone', async (req, res) => {
    try {
        const provider = await Provider.findOne({ phone: req.params.phone });

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        res.json({ success: true, data: provider });
    } catch (error) {
        console.error('Dashboard login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET provider bookings
router.get('/:id/bookings', async (req, res) => {
    try {
        const Booking = require('../models/Booking');
        const bookings = await Booking.find({ providerId: req.params.id })
            .sort({ createdAt: -1 });

        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
