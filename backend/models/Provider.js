const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Provider name is required'],
        trim: true,
        maxlength: 200
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    service: {
        type: String,
        required: [true, 'Service type is required'],
        enum: [
            'plumbing',
            'electrical',
            'cleaning',
            'painting',
            'carpentry',
            'appliance-repair',
            'gardening',
            'pest-control',
            'moving',
            'handyman'
        ]
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    // Human-readable address for display
    address: {
        type: String,
        required: [true, 'Address is required']
    },
    // Geospatial coordinates for distance calculations
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: [true, 'Coordinates are required'],
            validate: {
                validator: function (coords) {
                    return coords.length === 2 &&
                        coords[0] >= -180 && coords[0] <= 180 &&
                        coords[1] >= -90 && coords[1] <= 90;
                },
                message: 'Invalid coordinates'
            }
        }
    },
    rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// CRITICAL: 2dsphere index for geospatial queries
providerSchema.index({ location: '2dsphere' });
providerSchema.index({ service: 1 });
providerSchema.index({ isActive: 1 });

module.exports = mongoose.model('Provider', providerSchema);
