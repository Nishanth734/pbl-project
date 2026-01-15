const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');

// POST /api/reviews - Create review for completed booking
router.post('/', async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;

        // Validation
        if (!bookingId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID, rating, and comment are required'
            });
        }

        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Get booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if booking is completed
        if (booking.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Can only review completed bookings'
            });
        }

        // Check if already reviewed
        if (booking.hasReview) {
            return res.status(400).json({
                success: false,
                message: 'This booking has already been reviewed'
            });
        }

        // Create review
        const review = await Review.create({
            bookingId,
            providerId: booking.providerId,
            userId: booking.userId,
            userName: booking.userName,
            rating: ratingNum,
            comment: comment.trim()
        });

        // Update booking
        booking.hasReview = true;
        await booking.save();

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: review
        });
    } catch (error) {
        console.error('Create review error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'This booking has already been reviewed'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error creating review'
        });
    }
});

// GET /api/reviews/provider/:providerId - Get provider reviews
router.get('/provider/:providerId', async (req, res) => {
    try {
        const reviews = await Review.find({ providerId: req.params.providerId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
