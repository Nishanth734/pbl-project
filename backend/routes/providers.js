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
    { id: 'moving', name: 'Moving', icon: '📦' },
    { id: 'handyman', name: 'Handyman', icon: '🛠️' }
];

// GET /api/providers/categories - Get service categories
router.get('/categories', (req, res) => {
    res.json({
        success: true,
        data: SERVICE_CATEGORIES
    });
});

// POST /api/providers/register - Register new provider with GPS
router.post('/register', async (req, res) => {
    try {
        const { name, phone, service, price, latitude, longitude, address } = req.body;

        // Validation
        if (!name || !phone || !service || !price || !latitude || !longitude || !address) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: name, phone, service, price, latitude, longitude, address'
            });
        }

        // Validate coordinates
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        // Create provider
        const provider = await Provider.create({
            name,
            phone,
            service,
            price: parseFloat(price),
            address,
            location: {
                type: 'Point',
                coordinates: [lng, lat] // GeoJSON: [longitude, latitude]
            }
        });

        res.status(201).json({
            success: true,
            message: 'Provider registered successfully',
            data: {
                id: provider._id,
                name: provider.name,
                service: provider.service,
                price: provider.price,
                address: provider.address,
                rating: provider.rating
            }
        });
    } catch (error) {
        console.error('Register provider error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// GET /api/providers/nearby - Search providers near user location
router.get('/nearby', async (req, res) => {
    try {
        const { latitude, longitude, service, maxDistance = 50 } = req.query;

        // Validation
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        const maxDist = parseFloat(maxDistance) * 1000; // Convert km to meters

        // Build match filter
        const matchFilter = { isActive: true };
        if (service && service !== 'all') {
            matchFilter.service = service;
        }

        // GEOSPATIAL QUERY - $geoNear aggregation
        const providers = await Provider.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    distanceField: 'distance',
                    maxDistance: maxDist,
                    spherical: true,
                    query: matchFilter
                }
            },
            {
                $addFields: {
                    distanceKm: {
                        $round: [{ $divide: ['$distance', 1000] }, 1]
                    }
                }
            },
            { $sort: { distance: 1 } }, // Sort by nearest
            { $limit: 50 },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    phone: 1,
                    service: 1,
                    price: 1,
                    address: 1,  // Show address, NOT coordinates
                    rating: 1,
                    distanceKm: 1,
                    createdAt: 1
                }
            }
        ]);

        res.json({
            success: true,
            count: providers.length,
            data: providers
        });
    } catch (error) {
        console.error('Nearby search error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during search'
        });
    }
});

// GET /api/providers/:id - Get single provider
router.get('/:id', async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id).select('-location');

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        res.json({
            success: true,
            data: provider
        });
    } catch (error) {
        console.error('Get provider error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// GET /api/providers/dashboard/:phone - Get provider by phone for dashboard
router.get('/dashboard/:phone', async (req, res) => {
    try {
        const provider = await Provider.findOne({ phone: req.params.phone });

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found with this phone number'
            });
        }

        res.json({
            success: true,
            data: provider
        });
    } catch (error) {
        console.error('Dashboard login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// GET /api/providers/:id/bookings - Get all bookings for a provider
router.get('/:id/bookings', async (req, res) => {
    try {
        const Booking = require('../models/Booking');

        const bookings = await Booking.find({ providerId: req.params.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Provider bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
