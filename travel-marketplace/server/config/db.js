const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // Avoid reconnecting if already connected (important for serverless warm starts)
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in environment variables');
  }
  try {
    await mongoose.connect(uri, { 
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 44000
    });
    isConnected = true;
    console.log('MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      isConnected = false;
    });
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    isConnected = false;
    throw err;
  }
};

module.exports = connectDB;
