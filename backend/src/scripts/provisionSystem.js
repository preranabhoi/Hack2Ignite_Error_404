require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const DEPARTMENTS = [
  'Public Works & Roads',
  'Water Supply & Sanitation',
  'Electricity & Power',
  'Waste Management',
  'Drainage & Sewerage',
  'Street Lighting',
  'Public Safety',
  'Environment',
];

const provisionSystem = async () => {
  console.log('\n========================================');
  console.log('CivicAI System Provisioning');
  console.log('========================================\n');

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicai';
    await mongoose.connect(mongoUri);

    // 1. Initial Administrator Provisioning
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@civicai.gov').trim().toLowerCase();
    const adminName = process.env.ADMIN_NAME || 'Dr. Vikramaditya';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        department: 'General Administration',
        designation: 'Chief Grievance Redressal Officer',
        employeeId: 'ADM-001',
        phone: '+91 94379 00001',
        status: 'active',
        isActive: true,
        address: {
          city: 'Bhubaneswar',
          ward: 'Municipal Commissionerate Headquarters',
          pincode: '751001',
        },
      });
      console.log('✓ Administrator created successfully');
    } else {
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
      }
      console.log('✓ Administrator verified');
    }

    // 2. Demo Field Officers Provisioning (Hackathon Evaluation Only)
    const demoOfficers = [
      {
        name: 'Rajesh Verma',
        email: (process.env.DEMO_OFFICER_PWD_EMAIL || 'officer.pwd@civicai.gov').trim().toLowerCase(),
        password: process.env.DEMO_OFFICER_PWD_PASSWORD || 'password123',
        role: 'officer',
        department: 'Public Works & Roads',
        officerType: 'Road Maintenance Officer',
        designation: 'Senior Executive Engineer',
        employeeId: 'PWD-101',
        phone: '+91 94370 12345',
        status: 'active',
        address: { city: 'Bhubaneswar', ward: 'Zonal Office Central', pincode: '751001' },
      },
      {
        name: 'Sunita Mohanty',
        email: (process.env.DEMO_OFFICER_WATER_EMAIL || 'officer.water@civicai.gov').trim().toLowerCase(),
        password: process.env.DEMO_OFFICER_WATER_PASSWORD || 'password123',
        role: 'officer',
        department: 'Water Supply & Sanitation',
        officerType: 'Water Supply Officer',
        designation: 'Assistant Engineer (Water Works)',
        employeeId: 'WTR-202',
        phone: '+91 94371 67890',
        status: 'active',
        address: { city: 'Bhubaneswar', ward: 'Zonal Office North', pincode: '751013' },
      },
      {
        name: 'Amitabh Sen',
        email: (process.env.DEMO_OFFICER_ELECTRICITY_EMAIL || 'officer.electricity@civicai.gov').trim().toLowerCase(),
        password: process.env.DEMO_OFFICER_ELECTRICITY_PASSWORD || 'password123',
        role: 'officer',
        department: 'Electricity & Power',
        officerType: 'Electrical Officer',
        designation: 'Divisional Electrical Engineer',
        employeeId: 'ELE-303',
        phone: '+91 94372 11223',
        status: 'active',
        address: { city: 'Bhubaneswar', ward: 'Zonal Office South', pincode: '751002' },
      },
      {
        name: 'Kavita Das',
        email: (process.env.DEMO_OFFICER_WASTE_EMAIL || 'officer.waste@civicai.gov').trim().toLowerCase(),
        password: process.env.DEMO_OFFICER_WASTE_PASSWORD || 'password123',
        role: 'officer',
        department: 'Waste Management',
        officerType: 'Sanitation Officer',
        designation: 'Sanitary Inspector Lead',
        employeeId: 'WST-404',
        phone: '+91 94373 99887',
        status: 'active',
        address: { city: 'Bhubaneswar', ward: 'BMC Central Depot', pincode: '751009' },
      },
    ];

    for (const officerData of demoOfficers) {
      const existingOfficer = await User.findOne({ email: officerData.email });
      if (!existingOfficer) {
        await User.create(officerData);
      } else {
        if (existingOfficer.role !== 'officer' || existingOfficer.department !== officerData.department) {
          existingOfficer.role = 'officer';
          existingOfficer.department = officerData.department;
          existingOfficer.officerType = officerData.officerType;
          await existingOfficer.save();
        }
      }
    }
    console.log('✓ Demo officer accounts verified');

    // 3. Demo Citizen Provisioning
    const citizenEmail = (process.env.DEMO_CITIZEN_EMAIL || 'citizen@civicai.gov').trim().toLowerCase();
    const citizenPassword = process.env.DEMO_CITIZEN_PASSWORD || 'password123';
    let citizen = await User.findOne({ email: citizenEmail });
    if (!citizen) {
      await User.create({
        name: 'Aarav Sharma',
        email: citizenEmail,
        password: citizenPassword,
        role: 'citizen',
        department: 'None',
        phone: '+91 98765 43210',
        status: 'active',
        address: { city: 'Bhubaneswar', ward: 'Ward 14 (Saheed Nagar)', pincode: '751007' },
      });
      console.log('✓ Demo citizen account created');
    } else {
      console.log('✓ Demo citizen account verified');
    }

    console.log('\nSystem provisioning completed successfully.\n');
  } catch (error) {
    console.error('Provisioning error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  provisionSystem();
}

module.exports = { provisionSystem, DEPARTMENTS };
