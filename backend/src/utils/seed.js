require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { Grievance } = require('../models/Grievance');

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
    name: 'Rajesh Verma',
    email: 'officer.pwd@civicai.gov',
    password: 'password123',
    role: 'officer',
    department: 'Public Works & Roads',
    officerType: 'Road Maintenance Officer',
    designation: 'Senior Executive Engineer',
    employeeId: 'PWD-101',
    phone: '+91 94370 12345',
    status: 'active',
    address: {
      city: 'Bhubaneswar',
      ward: 'Zonal Office Central',
      pincode: '751001',
    },
  },
  {
    name: 'Sunita Mohanty',
    email: 'officer.water@civicai.gov',
    password: 'password123',
    role: 'officer',
    department: 'Water Supply & Sanitation',
    officerType: 'Water Supply Officer',
    designation: 'Assistant Engineer (Water Works)',
    employeeId: 'WTR-202',
    phone: '+91 94371 67890',
    status: 'active',
    address: {
      city: 'Bhubaneswar',
      ward: 'Zonal Office North',
      pincode: '751013',
    },
  },
  {
    name: 'Amitabh Sen',
    email: 'officer.electricity@civicai.gov',
    password: 'password123',
    role: 'officer',
    department: 'Electricity & Power',
    officerType: 'Electrical Officer',
    designation: 'Divisional Electrical Engineer',
    employeeId: 'ELE-303',
    phone: '+91 94372 11223',
    status: 'active',
    address: {
      city: 'Bhubaneswar',
      ward: 'Zonal Office South',
      pincode: '751002',
    },
  },
  {
    name: 'Kavita Das',
    email: 'officer.waste@civicai.gov',
    password: 'password123',
    role: 'officer',
    department: 'Waste Management',
    officerType: 'Sanitation Officer',
    designation: 'Sanitary Inspector Lead',
    employeeId: 'WST-404',
    phone: '+91 94373 99887',
    status: 'active',
    address: {
      city: 'Bhubaneswar',
      ward: 'BMC Central Depot',
      pincode: '751009',
    },
  },
  // 3. System Administrator
  {
    name: 'Dr. Vikramaditya',
    email: 'admin@civicai.gov',
    password: 'password123',
    role: 'admin',
    department: 'General Administration',
    designation: 'Chief Grievance Redressal Officer',
    employeeId: 'ADM-001',
    phone: '+91 94379 00001',
    status: 'active',
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

    // Clear existing users and grievances
    await User.deleteMany({});
    await Grievance.deleteMany({});
    console.log('[CivicAI Seed] Cleared existing users and grievances.');

    // Create users individually so pre-save hook hashes password properly
    const createdUsers = [];
    for (const userData of seedUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }

    const citizenAarav = createdUsers.find(
      (u) => u.email === 'citizen@civicai.gov'
    );
    const pwdOfficer = createdUsers.find(
      (u) => u.email === 'officer.pwd@civicai.gov'
    );
    const waterOfficer = createdUsers.find(
      (u) => u.email === 'officer.water@civicai.gov'
    );
    const electricityOfficer = createdUsers.find(
      (u) => u.email === 'officer.electricity@civicai.gov'
    );
    const wasteOfficer = createdUsers.find(
      (u) => u.email === 'officer.waste@civicai.gov'
    );

    // Seed initial realistic grievances assigned to each field officer
    const sampleGrievances = [
      // 1. PWD / Roads Grievance -> Assigned to Rajesh Verma
      {
        trackingId: 'CIVIC-2026-1042',
        title: 'Severe Potholes and Damaged Asphalt on Master Canteen Main Road',
        description:
          'Multiple deep potholes have formed on the main road stretch near Master Canteen square towards station road. During evening peak hours, two-wheelers are skidding and traffic congestion is extreme. Needs urgent resurfacing.',
        category: 'Roads',
        department: 'Public Works & Roads',
        priority: 'High',
        status: 'In Progress',
        location: {
          address: 'Master Canteen Square, Janpath Road, Unit 3',
          latitude: 20.2646,
          longitude: 85.8398,
          landmark: 'Opposite Railway Station Entry 2',
          city: 'Bhubaneswar',
          ward: 'Ward 12',
          pincode: '751001',
        },
        images: [
          'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        ],
        citizenId: citizenAarav._id,
        assignedOfficer: pwdOfficer._id,
        aiAnalysis: {
          category: 'Roads',
          department: 'Public Works & Roads',
          priority: 'High',
          summary:
            'Multiple deep asphalt potholes near Master Canteen causing commuter hazard and severe skidding.',
          suggestedAction:
            'Deploy asphalt road patching unit and roller equipment for urgent leveling.',
          status: 'completed',
          confidenceScore: 0.94,
          analyzedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        statusHistory: [
          {
            status: 'Submitted',
            changedBy: citizenAarav._id,
            comment: 'Citizen submitted grievance report with location and photograph.',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'Under Review',
            changedBy: pwdOfficer._id,
            comment: 'Municipal inspection team verified site condition.',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'In Progress',
            changedBy: pwdOfficer._id,
            comment: 'Asphalt patching crew dispatched with heavy road roller equipment.',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      // 2. Water Supply & Sanitation Grievance -> Assigned to Sunita Mohanty
      {
        trackingId: 'CIVIC-2026-1088',
        title: 'Drinking Water Pipeline Burst Causing Flooding in Lane 4',
        description:
          'Main underground drinking water distribution pipeline has ruptured near plot 214. Clean potable water has been gushing out continuously for the past 14 hours, flooding resident driveways and causing zero pressure in households.',
        category: 'Water Supply',
        department: 'Water Supply & Sanitation',
        priority: 'Critical',
        status: 'Assigned',
        location: {
          address: 'Plot 214, Lane 4, Saheed Nagar',
          latitude: 20.2917,
          longitude: 85.8456,
          landmark: 'Behind Community Center Park',
          city: 'Bhubaneswar',
          ward: 'Ward 14 (Saheed Nagar)',
          pincode: '751007',
        },
        images: [
          'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
        ],
        citizenId: citizenAarav._id,
        assignedOfficer: waterOfficer._id,
        aiAnalysis: {
          category: 'Water Supply',
          department: 'Water Supply & Sanitation',
          priority: 'Critical',
          summary:
            'Critical underground potable water pipeline rupture causing severe flooding and household shortage.',
          suggestedAction:
            'Isolate main water distribution valve and dispatch emergency excavation and pipeline replacement team.',
          status: 'completed',
          confidenceScore: 0.98,
          analyzedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
        },
        statusHistory: [
          {
            status: 'Submitted',
            changedBy: citizenAarav._id,
            comment: 'Emergency report logged by citizen.',
            timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
          },
          {
            status: 'Assigned',
            changedBy: waterOfficer._id,
            comment: 'Assigned to Ward 14 Water Works Emergency Repair Crew.',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          },
        ],
      },
      // 3. Electricity & Power Grievance -> Assigned to Amitabh Sen
      {
        trackingId: 'CIVIC-2026-1055',
        title: 'Sparking Distribution Transformer and Broken Streetlights in Ward 08',
        description:
          'Local distribution transformer on Nayapalli main road is sparking intermittently during evening hours. Streetlights on the 500-meter stretch are completely dark, causing safety hazards for pedestrians.',
        category: 'Electricity',
        department: 'Electricity & Power',
        priority: 'High',
        status: 'In Progress',
        location: {
          address: 'Main Road Junction, Sector 2, Nayapalli',
          latitude: 20.3012,
          longitude: 85.8164,
          landmark: 'Near Transformer Box #12',
          city: 'Bhubaneswar',
          ward: 'Ward 08 (Nayapalli)',
          pincode: '751012',
        },
        images: [
          'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
        ],
        citizenId: citizenAarav._id,
        assignedOfficer: electricityOfficer._id,
        aiAnalysis: {
          category: 'Electricity',
          department: 'Electricity & Power',
          priority: 'High',
          summary:
            'Sparking step-down transformer and dark streetlights posing electrical hazard and public safety risk.',
          suggestedAction:
            'Dispatch high-voltage line technician squad to isolate sparking unit and replace burned fuses and streetlight lamps.',
          status: 'completed',
          confidenceScore: 0.95,
          analyzedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        statusHistory: [
          {
            status: 'Submitted',
            changedBy: citizenAarav._id,
            comment: 'Citizen submitted electrical hazard complaint.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          {
            status: 'Assigned',
            changedBy: electricityOfficer._id,
            comment: 'Assigned to South Zone Power Maintenance Crew.',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
          {
            status: 'In Progress',
            changedBy: electricityOfficer._id,
            comment: 'Technician team dispatched with insulated lift equipment.',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
        ],
      },
      // 4. Waste Management Grievance -> Assigned to Kavita Das
      {
        trackingId: 'CIVIC-2026-1120',
        title: 'Overflowing Garbage Bins & Illegal Dumping at Market Corner',
        description:
          'Community waste containers have not been emptied for 4 consecutive days. Stray animals are scattering plastic waste across the pedestrian footpath causing terrible odor and sanitary hazard.',
        category: 'Waste Management',
        department: 'Waste Management',
        priority: 'Medium',
        status: 'Assigned',
        location: {
          address: 'Daily Market Complex, Sector 9, Saheed Nagar',
          latitude: 20.2882,
          longitude: 85.8421,
          landmark: 'Near Vegetable Mandi Gate 1',
          city: 'Bhubaneswar',
          ward: 'Ward 14 (Saheed Nagar)',
          pincode: '751007',
        },
        images: [
          'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
        ],
        citizenId: citizenAarav._id,
        assignedOfficer: wasteOfficer._id,
        aiAnalysis: {
          category: 'Waste Management',
          department: 'Waste Management',
          priority: 'Medium',
          summary:
            'Uncollected municipal garbage bins creating odor and sanitation hazard near market entrance.',
          suggestedAction:
            'Dispatch hydraulic compactor vehicle and sanitation crew for bin emptying and lime bleaching.',
          status: 'completed',
          confidenceScore: 0.91,
          analyzedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
        },
        statusHistory: [
          {
            status: 'Submitted',
            changedBy: citizenAarav._id,
            comment: 'Grievance submitted by citizen.',
            timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
          },
          {
            status: 'Assigned',
            changedBy: wasteOfficer._id,
            comment: 'Sanitation squad assigned for morning collection and site cleanup.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
        ],
      },
    ];

    for (const g of sampleGrievances) {
      await Grievance.create(g);
    }

    console.log(
      `[CivicAI Seed] Successfully seeded ${seedUsers.length} users and ${sampleGrievances.length} demo grievances!`
    );
    console.log('----------------------------------------------------');
    console.log('Demo Credentials (Password for all: password123):');
    console.log('1. Citizen: citizen@civicai.gov');
    console.log('2. Field Officer (PWD): officer.pwd@civicai.gov');
    console.log('3. Field Officer (Water & Sanitation): officer.water@civicai.gov');
    console.log('4. Field Officer (Electricity & Power): officer.electricity@civicai.gov');
    console.log('5. Field Officer (Waste Management): officer.waste@civicai.gov');
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
