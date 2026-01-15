const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

// POST create booking
router.post('/', async (req, res) => {
    try {
        const { userId, userName, userPhone, providerId, userAddress, latitude, longitude } = req.body;

        if (!userId || !userName || !userPhone || !providerId) {
            return res.status(400).json({
                success: false,
                message: 'All fields required'
            });
        }

        const provider = await Provider.findById(providerId);
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found'
            });
        }

        // Join services array into string for display
        const serviceDisplay = provider.services.join(', ');

        const booking = await Booking.create({
            providerId,
            userId,
            userName,
            userPhone,
            userAddress: userAddress || 'Not provided',
            service: serviceDisplay,
            price: provider.price,
            userLocation: latitude && longitude ? {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            } : undefined
        });

        res.status(201).json({
            success: true,
            message: 'Booking created',
            data: booking
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET user bookings
router.get('/user/:phone', async (req, res) => {
    try {
        const bookings = await Booking.find({ userPhone: req.params.phone })
            .populate('providerId', 'name phone address services rating')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        console.error('Get user bookings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT update booking status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['requested', 'accepted', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('providerId', 'name phone');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            message: 'Status updated',
            data: booking
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
