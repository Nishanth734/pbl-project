const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 100
    },
    phone: {
        type: String,
        required: [true, 'Phone is required'],
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'provider'],
        default: 'user'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    address: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Geospatial index
userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
