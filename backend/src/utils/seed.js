require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedUsers = [
  // 1. Citizen Demo
  {
    name: 'Aarav Sharma',
    email: 'citizen@civicai.gov',
    password: 'password123',
    role: 'citizen',
    department: 'None',
    phone: '+91 98765 43210',
    address: {
      city: 'Bhubaneswar',
      ward: 'Ward 14 (Saheed Nagar)',
      pincode: '751007',
    },
  },
  {
    name: 'Priya Patel',
    email: 'citizen2@civicai.gov',
    password: 'password123',
    role: 'citizen',
    department: 'None',
    phone: '+91 98111 22334',
    address: {
      city: 'Bhubaneswar',
      ward: 'Ward 08 (Nayapalli)',
      pincode: '751012',
    },
  },
  // 2. Officers in key departments
  {
    name: 'Rajesh Verma (PWD Officer)',
    email: 'officer.pwd@civicai.gov',
    password: 'password123',
    role: 'officer',
    department: 'Public Works & Roads',
    designation: 'Senior Executive Engineer',
    phone: '+91 94370 12345',
    address: {
      city: 'Bhubaneswar',
      ward: 'Zonal Office Central',
      pincode: '751001',
    },
  },
  {
    name: 'Sunita Mohanty (Water & Sanitation)',
    email: 'officer.water@civicai.gov',
    password: 'password123',
    role: 'officer',
    department: 'Water Supply & Sanitation',
    designation: 'Assistant Engineer (Water Works)',
    phone: '+91 94371 67890',
    address: {
      city: 'Bhubaneswar',
      ward: 'Zonal Office North',
      pincode: '751013',
    },
  },
  {
    name: 'Amitabh Sen (Electricity & Power)',
    email: 'officer.power@civicai.gov',
    password: 'password123',
    role: 'officer',
    department: 'Electricity & Power',
    designation: 'Divisional Electrical Engineer',
    phone: '+91 94372 11223',
    address: {
      city: 'Bhubaneswar',
      ward: 'Zonal Office South',
      pincode: '751002',
    },
  },
  {
    name: 'Kavita Das (Waste Management)',
    email: 'officer.waste@civicai.gov',
    password: 'password123',
    role: 'officer',
    department: 'Waste Management',
    designation: 'Sanitary Inspector Lead',
    phone: '+91 94373 99887',
    address: {
      city: 'Bhubaneswar',
      ward: 'BMC Central Depot',
      pincode: '751009',
    },
  },
  // 3. System Administrator
  {
    name: 'Dr. Vikramaditya (Admin)',
    email: 'admin@civicai.gov',
    password: 'password123',
    role: 'admin',
    department: 'General Administration',
    designation: 'Chief Grievance Redressal Officer',
    phone: '+91 94379 00001',
    address: {
      city: 'Bhubaneswar',
      ward: 'Municipal Commissionerate Headquarters',
      pincode: '751001',
    },
  },
];

const seedDatabase = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicai';
    await mongoose.connect(mongoUri);
    console.log('[CivicAI Seed] Connected to MongoDB...');

    // Clear existing users
    await User.deleteMany({});
    console.log('[CivicAI Seed] Cleared existing users.');

    // Create users individually so pre-save hook hashes password properly
    for (const userData of seedUsers) {
      await User.create(userData);
    }

    console.log(`[CivicAI Seed] Successfully seeded ${seedUsers.length} demo users!`);
    console.log('----------------------------------------------------');
    console.log('Demo Credentials (Password for all: password123):');
    console.log('1. Citizen: citizen@civicai.gov');
    console.log('2. PWD Officer: officer.pwd@civicai.gov');
    console.log('3. Water Officer: officer.water@civicai.gov');
    console.log('4. Power Officer: officer.power@civicai.gov');
    console.log('5. Waste Officer: officer.waste@civicai.gov');
    console.log('6. Administrator: admin@civicai.gov');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`[CivicAI Seed Error]: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedUsers, seedDatabase };
