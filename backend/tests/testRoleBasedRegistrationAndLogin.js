require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { Grievance } = require('../src/models/Grievance');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('CIVICAI — 20-POINT ROLE-BASED REGISTRATION & LOGIN TEST SUITE');
  console.log('================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failedCount++;
    }
  }

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicai';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  const timestamp = Date.now();
  let citizen1Token = '';
  let officer1Token = '';
  let admin1Token = '';
  let adminCreatedOfficerToken = '';
  let adminCreatedOfficerId = '';
  let createdGrievanceId = '';

  const citizenEmail = `citizen.${timestamp}@example.com`;
  const officerEmail = `officer.${timestamp}@example.gov`;
  const adminEmail = `admin.${timestamp}@example.gov`;
  const dynamicOfficerEmail = `dynamic.officer.${timestamp}@example.gov`;

  const validOfficerCode = process.env.OFFICER_REGISTRATION_CODE || 'OFFICER-CIVIC-2026';
  const validAdminCode = process.env.ADMIN_SETUP_CODE || process.env.ADMIN_REGISTRATION_CODE || 'ADMIN-CIVIC-2026';

  try {
    // ----------------------------------------------------
    // TEST 1: Register a new Citizen
    // ----------------------------------------------------
    console.log('TEST 1: Register a new Citizen');
    const regCitizenRes = await fetch(`${BASE_URL}/auth/register/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Citizen Test User',
        email: citizenEmail,
        password: 'Password123!',
        phone: '9876543210',
        ward: 'Ward 4',
        city: 'Bhubaneswar',
      }),
    });
    const regCitizenData = await regCitizenRes.json();
    assert(
      regCitizenRes.status === 201 && regCitizenData.user.role === 'citizen',
      'Citizen account created with role = "citizen"'
    );

    // ----------------------------------------------------
    // TEST 2: Citizen logs in
    // ----------------------------------------------------
    console.log('\nTEST 2: Citizen logs in');
    const citizenLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: citizenEmail,
        password: 'Password123!',
      }),
    });
    const citizenLoginData = await citizenLoginRes.json();
    citizen1Token = citizenLoginData.token;
    assert(
      citizenLoginRes.status === 200 && citizenLoginData.user.role === 'citizen',
      'Citizen logged in successfully with role = "citizen" (routes to Citizen Dashboard)'
    );

    // ----------------------------------------------------
    // TEST 3: Register a new Field Officer with valid code
    // ----------------------------------------------------
    console.log('\nTEST 3: Register a new Field Officer using valid registration code');
    const regOfficerRes = await fetch(`${BASE_URL}/auth/register/officer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Shah',
        email: officerEmail,
        password: 'Password123!',
        phone: '9876500001',
        employeeId: `WTR-${timestamp.toString().slice(-4)}`,
        department: 'Water Supply & Sanitation',
        officerType: 'Water Supply Officer',
        designation: 'Assistant Engineer',
        ward: 'Ward 2',
        city: 'Bhubaneswar',
        registrationCode: validOfficerCode,
      }),
    });
    const regOfficerData = await regOfficerRes.json();
    assert(
      regOfficerRes.status === 201 && regOfficerData.user.role === 'officer',
      'Field Officer registered with role = "officer" and verified code'
    );

    // ----------------------------------------------------
    // TEST 4: Field Officer logs in through normal /login
    // ----------------------------------------------------
    console.log('\nTEST 4: Field Officer logs in through normal /login');
    const officerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: officerEmail,
        password: 'Password123!',
      }),
    });
    const officerLoginData = await officerLoginRes.json();
    officer1Token = officerLoginData.token;
    assert(
      officerLoginRes.status === 200 && officerLoginData.user.role === 'officer',
      'Field Officer logged in via universal login with role = "officer" (routes to Officer Dashboard)'
    );

    // ----------------------------------------------------
    // TEST 5: Register a new Administrator with valid setup code
    // ----------------------------------------------------
    console.log('\nTEST 5: Register a new Administrator using valid administrator setup code');
    const regAdminRes = await fetch(`${BASE_URL}/auth/register/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Super Admin User',
        email: adminEmail,
        password: 'Password123!',
        phone: '9876500002',
        adminId: `ADM-${timestamp.toString().slice(-4)}`,
        setupCode: validAdminCode,
      }),
    });
    const regAdminData = await regAdminRes.json();
    assert(
      regAdminRes.status === 201 && regAdminData.user.role === 'admin',
      'Administrator registered with role = "admin" and verified setup code'
    );

    // ----------------------------------------------------
    // TEST 6: Administrator logs in
    // ----------------------------------------------------
    console.log('\nTEST 6: Administrator logs in');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: 'Password123!',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    admin1Token = adminLoginData.token;
    assert(
      adminLoginRes.status === 200 && adminLoginData.user.role === 'admin',
      'Administrator logged in via universal login with role = "admin" (routes to Admin Dashboard)'
    );

    // ----------------------------------------------------
    // TEST 7: Admin creates a new Field Officer
    // ----------------------------------------------------
    console.log('\nTEST 7: Admin creates a new Field Officer dynamically');
    const adminCreateOfficerRes = await fetch(`${BASE_URL}/admin/officers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        name: 'Arjun Joshi',
        email: dynamicOfficerEmail,
        password: 'TemporaryPass123!',
        phone: '9876500003',
        employeeId: `DRN-${timestamp.toString().slice(-4)}`,
        department: 'Drainage & Sewerage',
        officerType: 'Drainage Officer',
        designation: 'Senior Inspector',
        ward: 'Ward 6',
        city: 'Bhubaneswar',
        status: 'active',
      }),
    });
    const adminCreateOfficerData = await adminCreateOfficerRes.json();
    adminCreatedOfficerId = adminCreateOfficerData.officer?._id;
    assert(
      adminCreateOfficerRes.status === 201 && adminCreateOfficerData.officer?.role === 'officer',
      'Admin successfully created officer account for Arjun Joshi with role = "officer"'
    );

    // ----------------------------------------------------
    // TEST 8: New officer logs in using normal login page
    // ----------------------------------------------------
    console.log('\nTEST 8: New officer logs in using normal login page');
    const dynamicOfficerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: dynamicOfficerEmail,
        password: 'TemporaryPass123!',
      }),
    });
    const dynamicOfficerLoginData = await dynamicOfficerLoginRes.json();
    adminCreatedOfficerToken = dynamicOfficerLoginData.token;
    assert(
      dynamicOfficerLoginRes.status === 200 && dynamicOfficerLoginData.user.role === 'officer',
      'Admin-created officer logged in and received role = "officer"'
    );

    // ----------------------------------------------------
    // TEST 9: Assign a grievance to the newly created officer
    // ----------------------------------------------------
    console.log('\nTEST 9: Assign a grievance to the newly created officer');
    // Citizen submits grievance
    const submitGrievRes = await fetch(`${BASE_URL}/grievances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen1Token}`,
      },
      body: JSON.stringify({
        title: 'Broken drainage canal overflow',
        description: 'Flooding in lane 4 due to debris',
        category: 'Drainage',
        priority: 'High',
        location: {
          address: 'Lane 4, Sector 7',
          city: 'Bhubaneswar',
          ward: 'Ward 6',
        },
      }),
    });
    const submitGrievData = await submitGrievRes.json();
    createdGrievanceId = submitGrievData.grievance?._id;

    // Admin assigns to Arjun Joshi
    const assignRes = await fetch(`${BASE_URL}/admin/grievances/${createdGrievanceId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin1Token}`,
      },
      body: JSON.stringify({
        officerId: adminCreatedOfficerId,
        notes: 'Please inspect drainage site.',
      }),
    });
    assert(assignRes.status === 200, 'Admin assigned grievance to newly created officer Arjun Joshi');

    // ----------------------------------------------------
    // TEST 10: Officer sees only authorized/assigned grievances
    // ----------------------------------------------------
    console.log('\nTEST 10: Officer sees only authorized/assigned grievances');
    const officerTasksRes = await fetch(`${BASE_URL}/officer/grievances`, {
      headers: { Authorization: `Bearer ${adminCreatedOfficerToken}` },
    });
    const officerTasksData = await officerTasksRes.json();
    const hasAssigned = officerTasksData.grievances?.some((g) => g._id === createdGrievanceId);
    assert(
      officerTasksRes.status === 200 && officerTasksData.grievances?.length === 1 && hasAssigned,
      'Officer Arjun Joshi sees only the 1 grievance assigned to him'
    );

    // ----------------------------------------------------
    // TEST 11: Citizen attempts to access Admin APIs (403)
    // ----------------------------------------------------
    console.log('\nTEST 11: Citizen attempts to access Admin APIs');
    const citizenAdminAttemptRes = await fetch(`${BASE_URL}/admin/officers`, {
      headers: { Authorization: `Bearer ${citizen1Token}` },
    });
    assert(citizenAdminAttemptRes.status === 403, 'Citizen receives 403 Forbidden on Admin APIs');

    // ----------------------------------------------------
    // TEST 12: Officer attempts to access Admin Officer Management APIs (403)
    // ----------------------------------------------------
    console.log('\nTEST 12: Officer attempts to access Admin Officer Management APIs');
    const officerAdminAttemptRes = await fetch(`${BASE_URL}/admin/officers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify({
        name: 'Hacker Officer',
        email: `hack.${timestamp}@example.com`,
        password: 'Password123!',
      }),
    });
    assert(officerAdminAttemptRes.status === 403, 'Officer receives 403 Forbidden on Admin Officer creation API');

    // ----------------------------------------------------
    // TEST 13: Public citizen registration with role = "admin"
    // ----------------------------------------------------
    console.log('\nTEST 13: Public citizen registration with role = "admin"');
    const regEscAdminRes = await fetch(`${BASE_URL}/auth/register/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Fake Admin Attacker',
        email: `fakeadmin.${timestamp}@example.com`,
        password: 'Password123!',
        role: 'admin',
      }),
    });
    const regEscAdminData = await regEscAdminRes.json();
    const attackerDoc = await User.findOne({ email: `fakeadmin.${timestamp}@example.com` });
    assert(
      regEscAdminData.user.role === 'citizen' && attackerDoc.role === 'citizen',
      'Citizen registration ignores role="admin" and creates role="citizen"'
    );

    // ----------------------------------------------------
    // TEST 14: Public citizen registration with role = "officer"
    // ----------------------------------------------------
    console.log('\nTEST 14: Public citizen registration with role = "officer"');
    const regEscOfficerRes = await fetch(`${BASE_URL}/auth/register/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Fake Officer Attacker',
        email: `fakeofficer.${timestamp}@example.com`,
        password: 'Password123!',
        role: 'officer',
      }),
    });
    const regEscOfficerData = await regEscOfficerRes.json();
    const attackerOfficerDoc = await User.findOne({ email: `fakeofficer.${timestamp}@example.com` });
    assert(
      regEscOfficerData.user.role === 'citizen' && attackerOfficerDoc.role === 'citizen',
      'Citizen registration ignores role="officer" and creates role="citizen"'
    );

    // ----------------------------------------------------
    // TEST 15: Invalid administrator setup code
    // ----------------------------------------------------
    console.log('\nTEST 15: Invalid administrator setup code');
    const invalidAdminRes = await fetch(`${BASE_URL}/auth/register/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unauthorized Admin',
        email: `unauthadmin.${timestamp}@example.com`,
        password: 'Password123!',
        setupCode: 'WRONG-SETUP-CODE-1234',
      }),
    });
    assert(invalidAdminRes.status === 403, 'Administrator registration with invalid setup code is rejected with 403');

    // ----------------------------------------------------
    // TEST 16: Invalid officer registration code
    // ----------------------------------------------------
    console.log('\nTEST 16: Invalid officer registration code');
    const invalidOfficerRes = await fetch(`${BASE_URL}/auth/register/officer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unauthorized Officer',
        email: `unauthofficer.${timestamp}@example.com`,
        password: 'Password123!',
        employeeId: 'EMP-999',
        department: 'Public Works & Roads',
        registrationCode: 'INVALID-OFFICER-CODE',
      }),
    });
    assert(invalidOfficerRes.status === 400, 'Officer registration with invalid code is rejected with 400');

    // ----------------------------------------------------
    // TEST 17: Existing demo accounts still log in
    // ----------------------------------------------------
    console.log('\nTEST 17: Existing demo accounts still log in');
    const demoAccounts = [
      { email: 'citizen@civicai.gov', expectedRole: 'citizen' },
      { email: 'officer.pwd@civicai.gov', expectedRole: 'officer' },
      { email: 'admin@civicai.gov', expectedRole: 'admin' },
    ];
    let allDemoPassed = true;
    for (const demo of demoAccounts) {
      const demoRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demo.email, password: 'password123' }),
      });
      const demoData = await demoRes.json();
      if (demoRes.status !== 200 || demoData.user?.role !== demo.expectedRole) {
        allDemoPassed = false;
      }
    }
    assert(allDemoPassed, 'All existing demo accounts (citizen, officer, admin) log in successfully');

    // ----------------------------------------------------
    // TEST 18: Existing grievance functionality still works
    // ----------------------------------------------------
    console.log('\nTEST 18: Existing grievance functionality still works');
    const citizenGrievancesRes = await fetch(`${BASE_URL}/grievances/my`, {
      headers: { Authorization: `Bearer ${citizen1Token}` },
    });
    const citizenGrievancesData = await citizenGrievancesRes.json();
    assert(
      citizenGrievancesRes.status === 200 && Array.isArray(citizenGrievancesData.grievances),
      'Citizen grievance retrieval API functions properly'
    );

    // ----------------------------------------------------
    // TEST 19: Existing AI functionality still works
    // ----------------------------------------------------
    console.log('\nTEST 19: Existing AI functionality still works');
    const aiRecRes = await fetch(`${BASE_URL}/grievances/${createdGrievanceId}/resolution-recommendation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const aiRecData = await aiRecRes.json();
    assert(
      aiRecRes.status === 200 && aiRecData.recommendation && Array.isArray(aiRecData.recommendation.recommendedActions),
      'AI resolution recommendation generates structured actions successfully'
    );

    // ----------------------------------------------------
    // TEST 20: Existing Admin/Officer/Citizen dashboards still work
    // ----------------------------------------------------
    console.log('\nTEST 20: Existing Admin/Officer/Citizen dashboards still work');
    const adminStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const officerStatsRes = await fetch(`${BASE_URL}/officer/stats`, {
      headers: { Authorization: `Bearer ${officer1Token}` },
    });
    assert(
      adminStatsRes.status === 200 && officerStatsRes.status === 200,
      'Admin and Officer stats metrics load cleanly for existing dashboards'
    );

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log('\nCleaning up temporary test records...');
    await Grievance.findByIdAndDelete(createdGrievanceId);
    await User.deleteMany({
      email: {
        $in: [
          citizenEmail,
          officerEmail,
          adminEmail,
          dynamicOfficerEmail,
          `fakeadmin.${timestamp}@example.com`,
          `fakeofficer.${timestamp}@example.com`,
        ],
      },
    });
    console.log('Cleanup complete.');

  } catch (err) {
    console.error('Test execution error:', err);
    failedCount++;
  } finally {
    await mongoose.disconnect();
    console.log('\n================================================================');
    console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('================================================================');
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
