const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider',
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        trim: true,
        maxlength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

reviewSchema.index({ providerId: 1, createdAt: -1 });

// Update provider rating after review is saved
reviewSchema.post('save', async function () {
    const Review = this.constructor;
    const Provider = mongoose.model('Provider');

    const stats = await Review.aggregate([
        { $match: { providerId: this.providerId } },
        {
            $group: {
                _id: '$providerId',
                avgRating: { $avg: '$rating' },
                count: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await Provider.findByIdAndUpdate(this.providerId, {
            'rating.average': Math.round(stats[0].avgRating * 10) / 10,
            'rating.count': stats[0].count
        });
    }
});

module.exports = mongoose.model('Review', reviewSchema);
