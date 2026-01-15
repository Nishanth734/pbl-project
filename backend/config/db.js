// 2. db.js
// This configuration file manages the connection to MongoDB.
// It uses Mongoose to establish a reliable data link and
// handles connection errors for system stability.
const mongoose = require('mongoose');

// ===== SCREENSHOT START =====
// This section shows the implementation of MongoDB connection using Mongoose
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};
// ===== SCREENSHOT END =====

module.exports = connectDB;
