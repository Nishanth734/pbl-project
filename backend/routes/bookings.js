const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

// POST /api/bookings - Create new booking
router.post('/', async (req, res) => {
    try {
        const {
            userId,
            userName,
            userPhone,
            providerId,
            userAddress,
            latitude,
            longitude
        } = req.body;

        // Validation
        if (!userId || !userName || !userPhone || !providerId || !userAddress) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check provider exists
        const provider = await Provider.findById(providerId);
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        // Create booking
        const booking = await Booking.create({
            userId,
            userName,
            userPhone,
            providerId,
            service: provider.service,
            price: provider.price,
            userAddress,
            userLocation: {
                type: 'Point',
                coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0]
            },
            status: 'requested'
        });

        // Populate provider details
        await booking.populate('providerId', 'name phone service price address');

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating booking'
        });
    }
});

// GET /api/bookings/user/:userId - Get user's bookings
router.get('/user/:userId', async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.params.userId })
            .populate('providerId', 'name phone service price address rating')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('providerId', 'name phone service price address rating');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!['requested', 'accepted', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('providerId', 'name phone service price address');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            message: `Booking ${status}`,
            data: booking
        });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
