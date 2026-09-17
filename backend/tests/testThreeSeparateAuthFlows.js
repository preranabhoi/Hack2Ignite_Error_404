require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, body: data };
}

async function runTests() {
  console.log('=== Starting CivicAI Three Separate Role-Based Auth Flows Verification ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, detail = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${detail ? `-> ${JSON.stringify(detail)}` : ''}`);
      failed++;
    }
  }

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicai';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean up test-specific users
    await User.deleteMany({ email: /test.*@civicai\.gov/i });

    // 1. Citizen Flow
    console.log('\n--- 1. Citizen Registration & Sign-In Flow ---');
    const citizenEmail = `test.citizen.${Date.now()}@civicai.gov`;
    const citizenRegRes = await apiRequest('/auth/register/citizen', {
      method: 'POST',
      body: {
        name: 'Aarav Test Citizen',
        email: citizenEmail,
        password: 'password123',
        confirmPassword: 'password123',
        phone: '+91 98765 00001',
        city: 'Bhubaneswar',
        ward: 'Ward 14',
      },
    });

    assert(citizenRegRes.status === 201, 'Citizen registration via /api/auth/register/citizen returns HTTP 201', citizenRegRes);
    assert(citizenRegRes.body.user && citizenRegRes.body.user.role === 'citizen', 'Citizen role is assigned as "citizen"');

    const citizenLoginRes = await apiRequest('/auth/login/citizen', {
      method: 'POST',
      body: { email: citizenEmail, password: 'password123' },
    });
    assert(citizenLoginRes.status === 200, 'Citizen login via /api/auth/login/citizen returns HTTP 200', citizenLoginRes);
    assert(citizenLoginRes.body.user?.role === 'citizen', 'Citizen login response contains role: "citizen"');

    // 2. Field Officer Flow
    console.log('\n--- 2. Field Officer Registration & Sign-In Flow ---');
    const officerEmail = `test.officer.${Date.now()}@civicai.gov`;
    const officerEmpId = `OFF-${Date.now()}`;
    const officerRegRes = await apiRequest('/auth/register/officer', {
      method: 'POST',
      body: {
        name: 'Rajesh Test Officer',
        email: officerEmail,
        password: 'password123',
        confirmPassword: 'password123',
        phone: '+91 94370 00002',
        employeeId: officerEmpId,
        department: 'Public Works & Roads',
        designation: 'Senior Field Officer',
        ward: 'Ward 12',
        city: 'Bhubaneswar',
      },
    });

    assert(officerRegRes.status === 201, 'Field Officer registration via /api/auth/register/officer returns HTTP 201', officerRegRes);
    assert(officerRegRes.body.user && officerRegRes.body.user.role === 'officer', 'Field Officer role is assigned as "officer"');
    assert(officerRegRes.body.user.department === 'Public Works & Roads', 'Department is recorded as "Public Works & Roads"');

    const officerLoginRes = await apiRequest('/auth/login/officer', {
      method: 'POST',
      body: { email: officerEmail, password: 'password123' },
    });
    assert(officerLoginRes.status === 200, 'Officer login via /api/auth/login/officer returns HTTP 200', officerLoginRes);
    assert(officerLoginRes.body.user?.role === 'officer', 'Officer login response contains role: "officer"');

    // 3. Administrator Flow
    console.log('\n--- 3. Administrator Registration & Sign-In Flow ---');
    const adminEmail = `test.admin.${Date.now()}@civicai.gov`;
    const adminEmpId = `ADM-${Date.now()}`;
    const setupCode = process.env.ADMIN_SETUP_CODE || 'CivicAI_Admin_2026';

    const adminRegRes = await apiRequest('/auth/register/admin', {
      method: 'POST',
      body: {
        name: 'Dr. Test Administrator',
        email: adminEmail,
        password: 'password123',
        confirmPassword: 'password123',
        phone: '+91 94379 00003',
        adminId: adminEmpId,
        setupCode: setupCode,
      },
    });

    assert(adminRegRes.status === 201, 'Administrator registration via /api/auth/register/admin returns HTTP 201', adminRegRes);
    assert(adminRegRes.body.user && adminRegRes.body.user.role === 'admin', 'Administrator role is assigned as "admin"');

    const adminLoginRes = await apiRequest('/auth/login/admin', {
      method: 'POST',
      body: { email: adminEmail, password: 'password123' },
    });
    assert(adminLoginRes.status === 200, 'Administrator login via /api/auth/login/admin returns HTTP 200', adminLoginRes);
    assert(adminLoginRes.body.user?.role === 'admin', 'Administrator login response contains role: "admin"');

    // 4. Cross-Role Login Protection
    console.log('\n--- 4. Cross-Role Login Access Control ---');

    // Citizen attempting to login through Officer portal
    const citizenAtOfficer = await apiRequest('/auth/login/officer', {
      method: 'POST',
      body: { email: citizenEmail, password: 'password123' },
    });
    assert(citizenAtOfficer.status === 403, 'Citizen account rejected on /login/officer with HTTP 403', citizenAtOfficer);
    assert(citizenAtOfficer.body.message === 'These credentials are not registered as a Field Officer.', 'Returns helpful officer role mismatch message');

    // Officer attempting to login through Admin portal
    const officerAtAdmin = await apiRequest('/auth/login/admin', {
      method: 'POST',
      body: { email: officerEmail, password: 'password123' },
    });
    assert(officerAtAdmin.status === 403, 'Officer account rejected on /login/admin with HTTP 403', officerAtAdmin);
    assert(officerAtAdmin.body.message === 'These credentials are not registered as an Administrator.', 'Returns helpful admin role mismatch message');

    // Admin attempting to login through Citizen portal
    const adminAtCitizen = await apiRequest('/auth/login/citizen', {
      method: 'POST',
      body: { email: adminEmail, password: 'password123' },
    });
    assert(adminAtCitizen.status === 403, 'Admin account rejected on /login/citizen with HTTP 403', adminAtCitizen);
    assert(adminAtCitizen.body.message === 'These credentials are not registered as a Citizen.', 'Returns helpful citizen role mismatch message');

    // 5. Existing Demo Accounts via their respective endpoints
    console.log('\n--- 5. Demo Accounts Login on Dedicated Endpoints ---');
    const demoCitizen = await apiRequest('/auth/login/citizen', {
      method: 'POST',
      body: { email: 'citizen@civicai.gov', password: 'password123' },
    });
    assert(demoCitizen.status === 200 && demoCitizen.body.user?.role === 'citizen', 'Demo Citizen (Aarav Sharma) can log in via /login/citizen');

    const demoPwd = await apiRequest('/auth/login/officer', {
      method: 'POST',
      body: { email: 'officer.pwd@civicai.gov', password: 'password123' },
    });
    assert(demoPwd.status === 200 && demoPwd.body.user?.role === 'officer', 'Demo Officer (Rajesh Verma) can log in via /login/officer');

    const demoWater = await apiRequest('/auth/login/officer', {
      method: 'POST',
      body: { email: 'officer.water@civicai.gov', password: 'password123' },
    });
    assert(demoWater.status === 200 && demoWater.body.user?.role === 'officer', 'Demo Officer (Sunita Mohanty) can log in via /login/officer');

    const demoElectricity = await apiRequest('/auth/login/officer', {
      method: 'POST',
      body: { email: 'officer.electricity@civicai.gov', password: 'password123' },
    });
    assert(demoElectricity.status === 200 && demoElectricity.body.user?.role === 'officer', 'Demo Officer (Amitabh Sen) can log in via /login/officer');

    const demoWaste = await apiRequest('/auth/login/officer', {
      method: 'POST',
      body: { email: 'officer.waste@civicai.gov', password: 'password123' },
    });
    assert(demoWaste.status === 200 && demoWaste.body.user?.role === 'officer', 'Demo Officer (Kavita Das) can log in via /login/officer');

    const demoAdmin = await apiRequest('/auth/login/admin', {
      method: 'POST',
      body: { email: 'admin@civicai.gov', password: 'password123' },
    });
    assert(demoAdmin.status === 200 && demoAdmin.body.user?.role === 'admin', 'Demo Administrator (Dr. Vikramaditya) can log in via /login/admin');

    console.log(`\n=== Verification Summary: ${passed} Passed, ${failed} Failed ===`);

    // Clean up
    await User.deleteMany({ email: /test.*@civicai\.gov/i });
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
