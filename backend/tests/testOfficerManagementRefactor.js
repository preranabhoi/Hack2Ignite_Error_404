require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { Grievance } = require('../src/models/Grievance');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('CIVICAI — FINAL LOGIN & DYNAMIC FIELD OFFICER ACCOUNT TEST SUITE');
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
  let adminToken = '';
  let citizenToken = '';
  let officer1Token = '';
  let officer2Token = '';
  let newOfficerId = '';
  let officer2Id = '';
  let createdGrievanceId = '';

  const officer1Email = `neha.patil.${timestamp}@example.gov`;
  const officer2Email = `suresh.rao.${timestamp}@example.gov`;
  const citizenEmail = `citizen.test.${timestamp}@example.com`;
  const maliciousEmail1 = `fake.admin.${timestamp}@example.com`;
  const maliciousEmail2 = `fake.officer.${timestamp}@example.com`;

  try {
    // ----------------------------------------------------
    // PRE-SETUP: Admin Login
    // ----------------------------------------------------
    console.log('PRE-SETUP: Admin Login to perform provisioning');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@civicai.gov',
        password: 'password123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.user.role === 'admin', 'Admin logged in successfully');
    adminToken = adminLoginData.token;

    // ----------------------------------------------------
    // TEST 1: Create a new officer from Admin Dashboard
    // ----------------------------------------------------
    console.log('\nTEST 1: Create a new officer from Admin Dashboard');
    const createOfficerRes = await fetch(`${BASE_URL}/admin/officers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Neha Patil',
        email: officer1Email,
        password: 'SecurePassword123!',
        phone: '9876543210',
        employeeId: `DRN-${timestamp.toString().slice(-4)}`,
        department: 'Drainage & Sewerage',
        officerType: 'Drainage Officer',
        designation: 'Senior Inspector',
        ward: 'Ward 5',
        city: 'Dhule',
        status: 'active',
      }),
    });
    const createOfficerData = await createOfficerRes.json();
    newOfficerId = createOfficerData.officer?._id;
    assert(createOfficerRes.status === 201 && !!newOfficerId, 'Admin created new officer account successfully via POST /api/admin/officers');

    // ----------------------------------------------------
    // TEST 2: Verify the officer exists in MongoDB
    // ----------------------------------------------------
    console.log('\nTEST 2: Verify the officer exists in MongoDB');
    const officerDoc = await User.findById(newOfficerId);
    assert(officerDoc !== null && officerDoc.email === officer1Email, 'Officer document found in MongoDB database');

    // ----------------------------------------------------
    // TEST 3: Verify role = officer
    // ----------------------------------------------------
    console.log('\nTEST 3: Verify role = officer');
    assert(officerDoc.role === 'officer', 'Officer role is strictly set to "officer" in database');

    // ----------------------------------------------------
    // TEST 4: Verify password is hashed
    // ----------------------------------------------------
    console.log('\nTEST 4: Verify password is hashed');
    const officerWithPass = await User.findById(newOfficerId).select('+password');
    assert(
      officerWithPass.password &&
      officerWithPass.password.startsWith('$2') &&
      !officerWithPass.password.includes('SecurePassword123!'),
      'Password in MongoDB is securely hashed with bcrypt (starts with $2...)'
    );

    // ----------------------------------------------------
    // TEST 5: Log in using newly created officer credentials
    // ----------------------------------------------------
    console.log('\nTEST 5: Log in using the newly created officer email/password');
    const officerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: officer1Email,
        password: 'SecurePassword123!',
      }),
    });
    const officerLoginData = await officerLoginRes.json();
    assert(
      officerLoginRes.status === 200 && officerLoginData.user.role === 'officer',
      'Officer logged in through universal login endpoint and received role = "officer" (triggers redirect to /officer)'
    );
    officer1Token = officerLoginData.token;

    // ----------------------------------------------------
    // TEST 6: Verify dashboard displays new officer actual name
    // ----------------------------------------------------
    console.log('\nTEST 6: Verify the dashboard displays the new officer\'s actual name');
    const officerProfileRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${officer1Token}` },
    });
    const officerProfileData = await officerProfileRes.json();
    assert(officerProfileData.user.name === 'Neha Patil', `Authenticated profile returns actual name: "${officerProfileData.user.name}"`);

    // ----------------------------------------------------
    // TEST 7: Verify dashboard displays correct department & classification
    // ----------------------------------------------------
    console.log('\nTEST 7: Verify dashboard displays the correct department');
    assert(
      officerProfileData.user.department === 'Drainage & Sewerage' &&
      officerProfileData.user.officerType === 'Drainage Officer',
      `Authenticated profile returns department: "${officerProfileData.user.department}" and officerType: "${officerProfileData.user.officerType}"`
    );

    // ----------------------------------------------------
    // TEST 8: Assign a grievance to the newly created officer
    // ----------------------------------------------------
    console.log('\nTEST 8: Assign a grievance to the newly created officer');
    // 1. Citizen registers and creates grievance
    const citizenRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Public Citizen',
        email: citizenEmail,
        password: 'password123',
        phone: '9876543210',
        city: 'Dhule',
        ward: 'Ward 5',
      }),
    });
    const citizenRegData = await citizenRegRes.json();
    citizenToken = citizenRegData.token;

    const createGrievRes = await fetch(`${BASE_URL}/grievances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        title: 'Severe drainage overflow on Main Street',
        description: 'Water clogging due to blocked culvert near municipal market',
        category: 'Drainage',
        priority: 'High',
        location: {
          address: 'Main Street, Ward 5',
          city: 'Dhule',
          ward: 'Ward 5',
        },
      }),
    });
    const createGrievData = await createGrievRes.json();
    createdGrievanceId = createGrievData.grievance?._id;

    // 2. Admin assigns grievance to Neha Patil
    const assignRes = await fetch(`${BASE_URL}/admin/grievances/${createdGrievanceId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        officerId: newOfficerId,
        notes: 'Conduct immediate site clearance.',
      }),
    });
    assert(assignRes.status === 200, 'Admin assigned grievance to officer Neha Patil');

    // ----------------------------------------------------
    // TEST 9: Log in as that officer -> Only assigned grievance visible
    // ----------------------------------------------------
    console.log('\nTEST 9: Log in as that officer -> Only their authorized/assigned grievance is visible');
    const officerGrievancesRes = await fetch(`${BASE_URL}/officer/grievances`, {
      headers: { Authorization: `Bearer ${officer1Token}` },
    });
    const officerGrievancesData = await officerGrievancesRes.json();
    const hasAssignedTicket = officerGrievancesData.grievances?.some((g) => g._id === createdGrievanceId);
    assert(
      officerGrievancesRes.status === 200 &&
      officerGrievancesData.grievances.length === 1 &&
      hasAssignedTicket,
      'Officer Neha Patil sees exactly 1 grievance (the one assigned to her account)'
    );

    // ----------------------------------------------------
    // TEST 10: Create another officer with different department -> Independent logins
    // ----------------------------------------------------
    console.log('\nTEST 10: Create another officer with a different department');
    const createOfficer2Res = await fetch(`${BASE_URL}/admin/officers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Suresh Rao',
        email: officer2Email,
        password: 'Password456!',
        phone: '9812345678',
        employeeId: `SAF-${timestamp.toString().slice(-4)}`,
        department: 'Public Safety',
        officerType: 'Public Safety Officer',
        designation: 'Safety Field Inspector',
        ward: 'Ward 8',
        city: 'Dhule',
        status: 'active',
      }),
    });
    const createOfficer2Data = await createOfficer2Res.json();
    officer2Id = createOfficer2Data.officer?._id;

    const officer2LoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: officer2Email,
        password: 'Password456!',
      }),
    });
    const officer2LoginData = await officer2LoginRes.json();
    officer2Token = officer2LoginData.token;

    const officer2GrievancesRes = await fetch(`${BASE_URL}/officer/grievances`, {
      headers: { Authorization: `Bearer ${officer2Token}` },
    });
    const officer2GrievancesData = await officer2GrievancesRes.json();

    assert(
      createOfficer2Res.status === 201 &&
      officer2LoginRes.status === 200 &&
      officer2GrievancesData.grievances.length === 0,
      'Second officer (Suresh Rao, Public Safety) created, logs in independently, and has isolated workspace (0 tickets)'
    );

    // ----------------------------------------------------
    // TEST 11: Citizen attempts to access POST /api/admin/officers (403)
    // ----------------------------------------------------
    console.log('\nTEST 11: Citizen attempts to access POST /api/admin/officers');
    const citizenAttemptRes = await fetch(`${BASE_URL}/admin/officers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        name: 'Malicious Citizen Officer',
        email: `citizen.unauth.${timestamp}@example.com`,
        password: 'password123',
        department: 'Public Works & Roads',
      }),
    });
    assert(citizenAttemptRes.status === 403, 'Citizen receives 403 Forbidden when calling officer creation endpoint');

    // ----------------------------------------------------
    // TEST 12: Officer attempts to access POST /api/admin/officers (403)
    // ----------------------------------------------------
    console.log('\nTEST 12: Officer attempts to access POST /api/admin/officers');
    const officerAttemptRes = await fetch(`${BASE_URL}/admin/officers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officer1Token}`,
      },
      body: JSON.stringify({
        name: 'Malicious Officer 2',
        email: `officer.unauth.${timestamp}@example.com`,
        password: 'password123',
        department: 'Public Works & Roads',
      }),
    });
    assert(officerAttemptRes.status === 403, 'Officer receives 403 Forbidden when calling officer creation endpoint');

    // ----------------------------------------------------
    // TEST 13: Try public registration with role = "admin"
    // ----------------------------------------------------
    console.log('\nTEST 13: Try public registration with role = "admin"');
    const regAdminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Admin',
        email: maliciousEmail1,
        password: 'password123',
        role: 'admin',
      }),
    });
    const regAdminData = await regAdminRes.json();
    const attackerAdminDoc = await User.findOne({ email: maliciousEmail1 });
    assert(
      attackerAdminDoc && attackerAdminDoc.role === 'citizen' && regAdminData.user.role === 'citizen',
      'Public registration with role="admin" is ignored and forced to role="citizen"'
    );

    // ----------------------------------------------------
    // TEST 14: Try public registration with role = "officer"
    // ----------------------------------------------------
    console.log('\nTEST 14: Try public registration with role = "officer"');
    const regOfficerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Officer',
        email: maliciousEmail2,
        password: 'password123',
        role: 'officer',
      }),
    });
    const regOfficerData = await regOfficerRes.json();
    const attackerOfficerDoc = await User.findOne({ email: maliciousEmail2 });
    assert(
      attackerOfficerDoc && attackerOfficerDoc.role === 'citizen' && regOfficerData.user.role === 'citizen',
      'Public registration with role="officer" is ignored and forced to role="citizen"'
    );

    // ----------------------------------------------------
    // TEST 15: Deactivate an officer -> Login blocked
    // ----------------------------------------------------
    console.log('\nTEST 15: Deactivate an officer -> Officer cannot log in');
    const deactRes = await fetch(`${BASE_URL}/admin/officers/${newOfficerId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'inactive' }),
    });
    assert(deactRes.status === 200, 'Admin deactivated officer account');

    const blockedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: officer1Email,
        password: 'SecurePassword123!',
      }),
    });
    const blockedLoginData = await blockedLoginRes.json();
    assert(
      blockedLoginRes.status === 403 &&
      blockedLoginData.message === 'Your account is inactive. Please contact the administrator.',
      'Deactivated officer login rejected with 403 and clean message: "Your account is inactive. Please contact the administrator."'
    );

    // ----------------------------------------------------
    // TEST 16: Reactivate officer -> Officer can log in again
    // ----------------------------------------------------
    console.log('\nTEST 16: Reactivate officer -> Officer can log in again');
    const reactRes = await fetch(`${BASE_URL}/admin/officers/${newOfficerId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'active' }),
    });
    assert(reactRes.status === 200, 'Admin reactivated officer account');

    const unblockedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: officer1Email,
        password: 'SecurePassword123!',
      }),
    });
    assert(unblockedLoginRes.status === 200, 'Reactivated officer logged in successfully again');

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log('\nCleaning up temporary test records...');
    await Grievance.findByIdAndDelete(createdGrievanceId);
    await User.deleteMany({
      email: {
        $in: [
          officer1Email,
          officer2Email,
          citizenEmail,
          maliciousEmail1,
          maliciousEmail2,
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
