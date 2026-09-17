const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicai';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[CivicAI] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[CivicAI Database Error]: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
