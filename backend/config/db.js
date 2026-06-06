const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leadforge';
    console.log(`Connecting to MongoDB: ${connStr}`);
    
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s if MongoDB is not running
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('Please ensure MongoDB Community Server is installed and running locally.');
    // Do not crash the server immediately so that developers can check settings
  }
};

module.exports = connectDB;
