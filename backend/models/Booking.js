const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'User ID is required']
    },
    userName: {
        type: String,
        required: [true, 'User name is required']
    },
    userPhone: {
        type: String,
        required: [true, 'User phone is required']
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider',
        required: [true, 'Provider ID is required']
    },
    service: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['requested', 'accepted', 'completed', 'cancelled'],
        default: 'requested'
    },
    userAddress: {
        type: String,
        required: true
    },
    userLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    hasReview: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ providerId: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
