const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
        maxlength: [200, 'Name cannot exceed 200 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true
    },
    services: {
        type: [String],
        required: [true, 'At least one service is required'],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'Select at least one service'
        }
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [1, 'Price must be at least 1']
    },
    address: {
        type: String,
        default: 'Location captured via GPS'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    rating: {
        average: { type: Number, default: 0 },
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

providerSchema.index({ location: '2dsphere' });
providerSchema.index({ phone: 1 });
providerSchema.index({ services: 1 });

module.exports = mongoose.model('Provider', providerSchema);
