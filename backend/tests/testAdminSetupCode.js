require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('CIVICAI — ADMINISTRATOR SETUP CODE VALIDATION TEST SUITE');
  console.log('================================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicai';
  await mongoose.connect(mongoUri);

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

  const timestamp = Date.now();
  const validSetupCode = process.env.ADMIN_SETUP_CODE || 'ADMIN-CIVIC-2026';

  const testAdmin1Email = `admin.test1.${timestamp}@civicai.gov`;
  const testAdmin2Email = `admin.test2.${timestamp}@civicai.gov`;
  const testCitizenEmail = `citizen.test.${timestamp}@civicai.gov`;
  const testAdmin1Id = `ADM-T1-${timestamp.toString().slice(-4)}`;

  try {
    // ----------------------------------------------------
    // CASE 1: Correct setup code -> Administrator account successfully created
    // ----------------------------------------------------
    console.log('CASE 1: Correct setup code -> Administrator account successfully created');
    const case1Res = await fetch(`${BASE_URL}/auth/register/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Administrator 1',
        email: testAdmin1Email,
        password: 'Password123!',
        phone: '+91 94370 99991',
        adminId: testAdmin1Id,
        setupCode: validSetupCode,
      }),
    });
    const case1Data = await case1Res.json();
    assert(
      case1Res.status === 201 &&
        case1Data.success === true &&
        case1Data.user?.role === 'admin' &&
        case1Data.token &&
        !case1Data.user?.password,
      `Case 1: Admin created successfully with role 'admin', token generated, and password omitted (Status: ${case1Res.status})`
    );

    // ----------------------------------------------------
    // CASE 2: Incorrect setup code -> 403 -> "Invalid administrator setup code. Access denied."
    // ----------------------------------------------------
    console.log('\nCASE 2: Incorrect setup code -> 403 -> "Invalid administrator setup code. Access denied."');
    const case2Res = await fetch(`${BASE_URL}/auth/register/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Admin',
        email: `attacker.${timestamp}@badactor.gov`,
        password: 'Password123!',
        phone: '+91 94370 99992',
        adminId: `ADM-ATTACK-${timestamp.toString().slice(-4)}`,
        setupCode: 'WRONG_SETUP_CODE_123',
      }),
    });
    const case2Data = await case2Res.json();
    assert(
      case2Res.status === 403 &&
        case2Data.message === 'Invalid administrator setup code. Access denied.',
      `Case 2: Wrong setup code returned 403 with exact message: "${case2Data.message}"`
    );

    // ----------------------------------------------------
    // CASE 3: Missing setup code -> validation error (400)
    // ----------------------------------------------------
    console.log('\nCASE 3: Missing setup code -> validation error (400)');
    const case3Res = await fetch(`${BASE_URL}/auth/register/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'No Code Admin',
        email: `nocode.${timestamp}@civicai.gov`,
        password: 'Password123!',
        phone: '+91 94370 99993',
        adminId: `ADM-NOCODE-${timestamp.toString().slice(-4)}`,
      }),
    });
    const case3Data = await case3Res.json();
    assert(
      case3Res.status === 400 &&
        case3Data.message === 'Administrator Setup Code is required.',
      `Case 3: Missing setup code returned 400 validation error (Status: ${case3Res.status}, Message: "${case3Data.message}")`
    );

    // ----------------------------------------------------
    // CASE 3B: ADMIN_SETUP_CODE missing from server environment -> 500 error
    // ----------------------------------------------------
    console.log('\nCASE 3B: ADMIN_SETUP_CODE missing from server environment -> 500 "Administrator setup is not configured."');
    const savedSetup = process.env.ADMIN_SETUP_CODE;
    const savedReg = process.env.ADMIN_REGISTRATION_CODE;
    delete process.env.ADMIN_SETUP_CODE;
    delete process.env.ADMIN_REGISTRATION_CODE;

    let mockStatus = 0;
    let mockJson = null;
    const mockReq = {
      body: {
        name: 'Unconfigured Admin',
        email: `unconf.${timestamp}@civicai.gov`,
        password: 'Password123!',
        setupCode: 'SOME_CODE',
      },
    };
    const mockRes = {
      status: (code) => {
        mockStatus = code;
        return mockRes;
      },
      json: (data) => {
        mockJson = data;
        return mockRes;
      },
    };
    const { registerAdmin } = require('../src/controllers/authController');
    await registerAdmin(mockReq, mockRes, () => {});
    assert(
      mockStatus === 500 && mockJson?.message === 'Administrator setup is not configured.',
      `Case 3B: Controller returned 500 with message: "${mockJson?.message}" when ADMIN_SETUP_CODE is unset`
    );

    // Restore env vars
    if (savedSetup) process.env.ADMIN_SETUP_CODE = savedSetup;
    if (savedReg) process.env.ADMIN_REGISTRATION_CODE = savedReg;

    // ----------------------------------------------------
    // CASE 4: Duplicate Email & Duplicate Administrator ID checks
    // ----------------------------------------------------
    console.log('\nCASE 4: Duplicate Admin Checks (Email & Admin ID)');
    // Attempt duplicate email
    const dupEmailRes = await fetch(`${BASE_URL}/auth/register/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Email Admin',
        email: testAdmin1Email,
        password: 'Password123!',
        phone: '+91 94370 99994',
        adminId: `ADM-NEW-${timestamp.toString().slice(-4)}`,
        setupCode: validSetupCode,
      }),
    });
    const dupEmailData = await dupEmailRes.json();
    assert(
      dupEmailRes.status === 400 &&
        dupEmailData.message === 'An administrator account with this email already exists.',
      `Duplicate email rejected with 400: "${dupEmailData.message}"`
    );

    // Attempt duplicate administrator ID
    const dupIdRes = await fetch(`${BASE_URL}/auth/register/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate ID Admin',
        email: `unique.admin.${timestamp}@civicai.gov`,
        password: 'Password123!',
        phone: '+91 94370 99995',
        adminId: testAdmin1Id,
        setupCode: validSetupCode,
      }),
    });
    const dupIdData = await dupIdRes.json();
    assert(
      dupIdRes.status === 400 &&
        dupIdData.message === 'An administrator with this Administrator ID already exists.',
      `Duplicate Administrator ID rejected with 400: "${dupIdData.message}"`
    );

    // ----------------------------------------------------
    // CASE 5: Attempt to register admin with role="citizen" or role="officer" -> forced role="admin"
    // ----------------------------------------------------
    console.log('\nCASE 5: Attempt to register admin using role="citizen" or role="officer" -> forced role="admin"');
    const case5Res = await fetch(`${BASE_URL}/auth/register/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Role Tampering Admin',
        email: testAdmin2Email,
        password: 'Password123!',
        phone: '+91 94370 99996',
        adminId: `ADM-T2-${timestamp.toString().slice(-4)}`,
        setupCode: validSetupCode,
        role: 'citizen', // Trying to override role
      }),
    });
    const case5Data = await case5Res.json();
    assert(
      case5Res.status === 201 && case5Data.user?.role === 'admin',
      `Admin registration endpoint enforced role="admin" regardless of client input (Role: ${case5Data.user?.role})`
    );

    // ----------------------------------------------------
    // CASE 6: Citizen public registration with role="admin" -> forced role="citizen"
    // ----------------------------------------------------
    console.log('\nCASE 6: Citizen public registration with role="admin" -> forced role="citizen"');
    const case6Res = await fetch(`${BASE_URL}/auth/register/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Privilege Escalation Citizen',
        email: testCitizenEmail,
        password: 'Password123!',
        phone: '+91 98765 43210',
        ward: 'Ward 10',
        city: 'Bhubaneswar',
        role: 'admin', // Malicious attempt to get admin role
      }),
    });
    const case6Data = await case6Res.json();
    assert(
      case6Res.status === 201 && case6Data.user?.role === 'citizen',
      `Citizen public registration enforced role="citizen" and blocked role tampering (Role: ${case6Data.user?.role})`
    );

    // ----------------------------------------------------
    // CASE 7: Existing demo administrator login continues working
    // ----------------------------------------------------
    console.log('\nCASE 7: Existing demo administrator login (Dr. Vikramaditya, admin@civicai.gov)');
    const demoAdminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@civicai.gov',
        password: 'password123',
      }),
    });
    const demoAdminLoginData = await demoAdminLoginRes.json();
    assert(
      demoAdminLoginRes.status === 200 &&
        demoAdminLoginData.user?.role === 'admin' &&
        demoAdminLoginData.user?.email === 'admin@civicai.gov',
      `Demo administrator logged in successfully with role "admin" (Name: ${demoAdminLoginData.user?.name})`
    );

    // ----------------------------------------------------
    // CASE 8: Newly registered Admin logs in and accesses Admin Dashboard API
    // ----------------------------------------------------
    console.log('\nCASE 8: Newly registered Admin logs in and accesses Admin Dashboard');
    const newAdminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testAdmin1Email,
        password: 'Password123!',
      }),
    });
    const newAdminLoginData = await newAdminLoginRes.json();
    assert(
      newAdminLoginRes.status === 200 && newAdminLoginData.user?.role === 'admin',
      `Newly registered admin logged in via universal login with role "admin"`
    );

    const adminStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${newAdminLoginData.token}` },
    });
    const adminStatsData = await adminStatsRes.json();
    assert(
      adminStatsRes.status === 200 && adminStatsData.stats,
      `Newly registered admin can access Admin Dashboard stats API`
    );

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log('\nCleaning up test accounts...');
    await User.deleteMany({
      email: {
        $in: [
          testAdmin1Email,
          testAdmin2Email,
          testCitizenEmail,
          `attacker.${timestamp}@badactor.gov`,
          `nocode.${timestamp}@civicai.gov`,
          `unique.admin.${timestamp}@civicai.gov`,
        ],
      },
    });
    console.log('Cleanup completed.');

  } catch (err) {
    console.error('Test error:', err);
    failedCount++;
  } finally {
    await mongoose.disconnect();
    console.log('\n================================================================');
    console.log(`ADMIN SETUP CODE TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('================================================================');
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
