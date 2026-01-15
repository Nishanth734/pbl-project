require('dotenv').config();
const mongoose = require('mongoose');
const Provider = require('../models/Provider');

const providers = [
    {
        name: "Sharma Plumbing Services",
        phone: "9876543001",
        services: ["plumbing", "handyman"],
        price: 500,
        address: "Andheri West, Mumbai",
        location: { type: "Point", coordinates: [72.8361, 19.1364] },
        rating: { average: 4.5, count: 28 }
    },
    {
        name: "PowerFix Electricals",
        phone: "9876543002",
        services: ["electrical", "appliance-repair"],
        price: 600,
        address: "Bandra East, Mumbai",
        location: { type: "Point", coordinates: [72.8505, 19.0596] },
        rating: { average: 4.8, count: 45 }
    },
    {
        name: "CleanHome Services",
        phone: "9876543003",
        services: ["cleaning", "pest-control"],
        price: 800,
        address: "Powai, Mumbai",
        location: { type: "Point", coordinates: [72.9052, 19.1176] },
        rating: { average: 4.3, count: 32 }
    },
    {
        name: "ColorCraft Painters",
        phone: "9876543004",
        services: ["painting", "carpentry"],
        price: 1200,
        address: "Juhu, Mumbai",
        location: { type: "Point", coordinates: [72.8296, 19.1075] },
        rating: { average: 4.6, count: 19 }
    },
    {
        name: "GreenThumb Gardens",
        phone: "9876543005",
        services: ["gardening", "cleaning"],
        price: 700,
        address: "Malad West, Mumbai",
        location: { type: "Point", coordinates: [72.8479, 19.1872] },
        rating: { average: 4.4, count: 23 }
    },
    {
        name: "QuickFix Handyman",
        phone: "9876543006",
        services: ["handyman", "plumbing", "electrical", "carpentry"],
        price: 450,
        address: "Goregaon East, Mumbai",
        location: { type: "Point", coordinates: [72.8656, 19.1663] },
        rating: { average: 4.7, count: 56 }
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/home-services');
        console.log('Connected to MongoDB');

        await Provider.deleteMany({});
        console.log('Cleared existing providers');

        await Provider.insertMany(providers);
        console.log('✅ Seeded', providers.length, 'providers');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seedDatabase();
