const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homeservices';

// Sample providers with Bangalore data ONLY (as requested)
const sampleProviders = [
    // 1. Akshayanagar (Plumbing)
    {
        name: "Akshaya Home Repairs",
        phone: "91-9876543210",
        service: "plumbing",
        price: 450,
        address: "123 Main Rd, Akshayanagar, Bangalore, KA 560068",
        location: { type: "Point", coordinates: [77.6222, 12.8856] },
        rating: { average: 4.7, count: 15 }
    },
    // 2. Begur (Electrical)
    {
        name: "Begur Electricals",
        phone: "91-9988776655",
        service: "electrical",
        price: 550,
        address: "45 Lake View, Begur, Bangalore, KA 560068",
        location: { type: "Point", coordinates: [77.6397, 12.8828] },
        rating: { average: 4.5, count: 28 }
    },
    // 3. Jayanagar (Cleaning) - 4th Block
    {
        name: "Jayanagar Deep Clean",
        phone: "91-9900112233",
        service: "cleaning",
        price: 600,
        address: "32 4th Block, Jayanagar, Bangalore, KA 560011",
        location: { type: "Point", coordinates: [77.5938, 12.9250] },
        rating: { average: 4.8, count: 42 }
    },
    // 4. Jayanagar (Painting) - 3rd Block
    {
        name: "Royal Painters",
        phone: "91-9900112244",
        service: "painting",
        price: 800,
        address: "15 3rd Block, Jayanagar, Bangalore, KA 560011",
        location: { type: "Point", coordinates: [77.5850, 12.9300] },
        rating: { average: 4.6, count: 19 }
    },
    // 5. Kanakapura Town (Carpentry)
    {
        name: "Town Carpenters",
        phone: "91-9123456780",
        service: "carpentry",
        price: 700,
        address: "MG Road, Kanakapura Town, Ramanagara Dist",
        location: { type: "Point", coordinates: [77.4199, 12.5462] },
        rating: { average: 4.4, count: 12 }
    },
    // 6. Harohalli (Pest Control) - Industrial Area
    {
        name: "Industrial Pest Control",
        phone: "91-9123456781",
        service: "pest-control",
        price: 900,
        address: "KIADB Industrial Area, Harohalli, Kanakapura Rd",
        location: { type: "Point", coordinates: [77.4600, 12.6360] },
        rating: { average: 4.3, count: 8 }
    },
    // 7. Konanakunte Cross (Handyman)
    {
        name: "K-Cross Handyman",
        phone: "91-9123456782",
        service: "handyman",
        price: 400,
        address: "Cross Roads, Konanakunte, Bangalore, KA 560062",
        location: { type: "Point", coordinates: [77.5750, 12.8750] },
        rating: { average: 4.5, count: 25 }
    },
    // 8. Konanakunte (Moving)
    {
        name: "South Bangalore Movers",
        phone: "91-9123456783",
        service: "moving",
        price: 1200,
        address: "Near Metro, Konanakunte, Bangalore, KA 560062",
        location: { type: "Point", coordinates: [77.5760, 12.8760] },
        rating: { average: 4.2, count: 31 }
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Provider.deleteMany({});
        await Booking.deleteMany({});
        await Review.deleteMany({});
        console.log('🗑️  Cleared existing data (Removed SF/Old Data)');

        // Insert providers
        const providers = await Provider.insertMany(sampleProviders);
        console.log(`✅ Inserted ${providers.length} Bangalore providers`);

        // Create indexes
        await Provider.collection.createIndex({ location: '2dsphere' });
        console.log('✅ Created geospatial index');

        console.log('\n🎉 Database seeded strictly with Bangalore locations!\n');

        console.log('Sample Jayanagar provider:');
        console.log(JSON.stringify(providers[2], null, 2));

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
}

seedDatabase();
