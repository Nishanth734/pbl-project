const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Booking = require('../models/Booking');

// GET messages for a booking
router.get('/:bookingId', async (req, res) => {
    try {
        const messages = await Message.find({ bookingId: req.params.bookingId })
            .sort({ createdAt: 1 });

        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Send a message
router.post('/', async (req, res) => {
    try {
        const { bookingId, senderId, senderType, senderName, message } = req.body;

        if (!bookingId || !senderId || !senderType || !senderName || !message) {
            return res.status(400).json({ success: false, message: 'All fields required' });
        }

        const newMessage = await Message.create({
            bookingId,
            senderId,
            senderType,
            senderName,
            message: message.trim()
        });

        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get booking details for chat
router.get('/booking/:bookingId', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate('providerId', 'name phone services');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, data: booking });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
