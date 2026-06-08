const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryConnStr = process.env.MONGODB_URI;
  const fallbackConnStr = 'mongodb://127.0.0.1:27017/clientscout';

  if (!primaryConnStr) {
    console.log('No MONGODB_URI configured. Connecting to local fallback MongoDB...');
    try {
      await mongoose.connect(fallbackConnStr, { serverSelectionTimeoutMS: 3000 });
      console.log('✅ MongoDB Connected to local fallback instance.');
      return;
    } catch (err) {
      console.error(`❌ Local fallback MongoDB connection failed: ${err.message}`);
      return;
    }
  }

  try {
    console.log('Connecting to primary MongoDB (Atlas)...');
    const conn = await mongoose.connect(primaryConnStr, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s if primary is unreachable
    });
    console.log(`✅ MongoDB Connected to primary database: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️  Primary MongoDB Connection failed: ${error.message}`);
    console.log('🔄 Attempting automatic fallback to local MongoDB instance...');
    try {
      const conn = await mongoose.connect(fallbackConnStr, {
        serverSelectionTimeoutMS: 3000
      });
      console.log(`✅ MongoDB Connected to local fallback instance: ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`❌ Local fallback MongoDB connection also failed: ${fallbackError.message}`);
      console.warn('💡 Please check your internet connection / DNS, or ensure MongoDB Community Server is running locally on port 27017.');
    }
  }
};

module.exports = connectDB;
