require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { Grievance } = require('../src/models/Grievance');

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
  console.log('=== Starting CivicAI Authentication and Registration Automated Verification ===\n');

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

    // Test A: Citizen registration & role enforcement
    console.log('\n--- Scenario A: Citizen Registration & Role Enforcement ---');
    const citizenEmail = `test.citizen.${Date.now()}@civicai.gov`;
    const citizenRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        name: 'Test Citizen User',
        email: citizenEmail,
        password: 'password123',
        confirmPassword: 'password123',
        phone: '+91 9988776655',
        city: 'Bhubaneswar',
        ward: 'Ward 10',
        role: 'admin', // Attempt spoofing admin role
      },
    });

    assert(citizenRes.status === 201, 'Citizen registration returns HTTP 201', citizenRes);
    assert(citizenRes.body.user && citizenRes.body.user.role === 'citizen', 'Citizen role is strictly enforced as "citizen" despite role: "admin" in payload', citizenRes.body);
    assert(!citizenRes.body.user?.password, 'Password is not returned in citizen registration response');
    assert(!!citizenRes.body.token, 'Token is returned in citizen registration response');

    // Citizen login
    const citizenLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: citizenEmail, password: 'password123' },
    });
    assert(citizenLoginRes.status === 200, 'Citizen can log in successfully', citizenLoginRes);
    assert(citizenLoginRes.body.user?.role === 'citizen', 'Citizen login returns role: "citizen"');

    // Test B: Field Officer registration
    console.log('\n--- Scenario B: Field Officer Registration ---');
    const officerEmail = `test.officer.${Date.now()}@civicai.gov`;
    const officerEmpId = `TEST-OFF-${Date.now()}`;
    const officerRes = await apiRequest('/auth/register-officer', {
      method: 'POST',
      body: {
        name: 'Test Officer User',
        email: officerEmail,
        password: 'password123',
        confirmPassword: 'password123',
        phone: '+91 9123456780',
        employeeId: officerEmpId,
        department: 'Water Supply & Sanitation',
        designation: 'Assistant Engineer',
        ward: 'Ward 5',
        city: 'Bhubaneswar',
        role: 'admin', // Attempt spoofing admin
      },
    });

    assert(officerRes.status === 201, 'Field Officer registration returns HTTP 201', officerRes);
    assert(officerRes.body.user && officerRes.body.user.role === 'officer', 'Officer role is strictly forced to "officer"', officerRes.body);
    assert(officerRes.body.user?.department === 'Water Supply & Sanitation', 'Department is recorded accurately');
    assert(!officerRes.body.user?.password, 'Password is not returned in officer response');

    // Duplicate officer email check
    const dupOfficerEmailRes = await apiRequest('/auth/register-officer', {
      method: 'POST',
      body: {
        name: 'Duplicate Officer',
        email: officerEmail,
        password: 'password123',
        employeeId: `DIFF-ID-${Date.now()}`,
        department: 'Public Works & Roads',
      },
    });
    assert(dupOfficerEmailRes.status === 400, 'Duplicate officer email is rejected with HTTP 400', dupOfficerEmailRes);

    // Duplicate officer employee ID check
    const dupOfficerEmpRes = await apiRequest('/auth/register-officer', {
      method: 'POST',
      body: {
        name: 'Duplicate Officer ID',
        email: `diff.${Date.now()}@civicai.gov`,
        password: 'password123',
        employeeId: officerEmpId,
        department: 'Public Works & Roads',
      },
    });
    assert(dupOfficerEmpRes.status === 400, 'Duplicate officer employee ID is rejected with HTTP 400', dupOfficerEmpRes);

    // Officer login
    const officerLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: officerEmail, password: 'password123' },
    });
    assert(officerLoginRes.status === 200, 'Field Officer can log in successfully', officerLoginRes);
    assert(officerLoginRes.body.user?.role === 'officer', 'Officer login returns role: "officer"');

    // Test C & D: Administrator registration & setup code validation
    console.log('\n--- Scenario C & D: Administrator Registration & Setup Code ---');
    const adminEmail = `test.admin.${Date.now()}@civicai.gov`;
    const adminId = `TEST-ADM-${Date.now()}`;

    // Wrong setup code
    const wrongCodeRes = await apiRequest('/auth/register-admin', {
      method: 'POST',
      body: {
        name: 'Unauthorized Admin Candidate',
        email: adminEmail,
        password: 'password123',
        confirmPassword: 'password123',
        adminId: adminId,
        setupCode: 'WRONG_SETUP_CODE_123',
      },
    });
    assert(wrongCodeRes.status === 403, 'Wrong setup code returns HTTP 403', wrongCodeRes);
    assert(wrongCodeRes.body.message === 'Invalid administrator setup code. Access denied.', 'Returns exact access denied error message');

    // Correct setup code
    const correctCodeRes = await apiRequest('/auth/register-admin', {
      method: 'POST',
      body: {
        name: 'Test Administrator User',
        email: adminEmail,
        password: 'password123',
        confirmPassword: 'password123',
        phone: '+91 9900112233',
        adminId: adminId,
        setupCode: process.env.ADMIN_SETUP_CODE || 'CivicAI_Admin_2026',
      },
    });
    assert(correctCodeRes.status === 201, 'Correct setup code registers administrator with HTTP 201', correctCodeRes);
    assert(correctCodeRes.body.user && correctCodeRes.body.user.role === 'admin', 'Admin role is strictly assigned as "admin"', correctCodeRes.body);
    assert(!correctCodeRes.body.user?.password, 'Password is not returned in admin response');

    // Admin login
    const adminLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: 'password123' },
    });
    assert(adminLoginRes.status === 200, 'Administrator can log in successfully', adminLoginRes);
    assert(adminLoginRes.body.user?.role === 'admin', 'Admin login returns role: "admin"');

    // Test E: Existing demo officer logins
    console.log('\n--- Scenario E: Demo Field Officers Login ---');
    const demoOfficers = [
      { email: 'officer.pwd@civicai.gov', name: 'Rajesh Verma (PWD)' },
      { email: 'officer.water@civicai.gov', name: 'Sunita Mohanty (Water)' },
      { email: 'officer.electricity@civicai.gov', name: 'Amitabh Sen (Electricity)' },
      { email: 'officer.waste@civicai.gov', name: 'Kavita Das (Waste)' },
    ];

    for (const demo of demoOfficers) {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: demo.email, password: 'password123' },
      });
      assert(res.status === 200 && res.body.user?.role === 'officer', `Demo officer login works: ${demo.name}`, res);
    }

    // Test F: Existing demo admin login
    console.log('\n--- Scenario F: Demo Administrator Login ---');
    const demoAdminRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@civicai.gov', password: 'password123' },
    });
    assert(demoAdminRes.status === 200 && demoAdminRes.body.user?.role === 'admin', 'Demo administrator Dr. Vikramaditya can log in', demoAdminRes);

    // Test G: Admin creates new officer via POST /api/admin/officers
    console.log('\n--- Scenario G: Admin Creates Field Officer ---');
    const adminToken = demoAdminRes.body.token;
    const createdOfficerEmail = `admin.created.officer.${Date.now()}@civicai.gov`;
    const createdOfficerEmpId = `ADM-CRT-${Date.now()}`;

    const adminCreateOfficerRes = await apiRequest('/admin/officers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Admin Created Field Officer',
        email: createdOfficerEmail,
        password: 'password123',
        department: 'Electricity & Power',
        officerType: 'Electrical Officer',
        designation: 'Sub-Divisional Officer',
        employeeId: createdOfficerEmpId,
        phone: '+91 94370 99999',
        city: 'Bhubaneswar',
        ward: 'Ward 12',
      },
    });

    assert(adminCreateOfficerRes.status === 201, 'Administrator can create officer via POST /api/admin/officers', adminCreateOfficerRes);
    assert(adminCreateOfficerRes.body.officer && adminCreateOfficerRes.body.officer.role === 'officer', 'Created user has role: "officer"');

    // Check if new officer can log in
    const newOfficerLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: createdOfficerEmail, password: 'password123' },
    });
    assert(newOfficerLoginRes.status === 200 && newOfficerLoginRes.body.user?.role === 'officer', 'Admin-created officer can log in');

    // Test H: Security and Role Boundaries
    console.log('\n--- Scenario H: Security & Authorization Boundaries ---');
    const citizenToken = citizenLoginRes.body.token;
    const officerToken = officerLoginRes.body.token;

    // Citizen attempting to access admin API
    const citizenToAdmin = await apiRequest('/admin/stats', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(citizenToAdmin.status === 403, 'Citizen is forbidden from accessing Admin APIs (403)');

    // Officer attempting to access admin API
    const officerToAdmin = await apiRequest('/admin/stats', {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    assert(officerToAdmin.status === 403, 'Officer is forbidden from accessing Admin APIs (403)');

    // Citizen attempting to access officer APIs
    const citizenToOfficer = await apiRequest('/officer/stats', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert(citizenToOfficer.status === 403, 'Citizen is forbidden from accessing Officer APIs (403)');

    // Admin accessing admin API
    const adminToAdmin = await apiRequest('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminToAdmin.status === 200, 'Admin can access Admin APIs (200)');

    // Password storage verification
    const dbCitizen = await User.findOne({ email: citizenEmail }).select('+password');
    assert(dbCitizen.password.startsWith('$2a$') || dbCitizen.password.startsWith('$2b$'), 'Password in MongoDB is securely hashed with bcrypt');

    // Test I: Existing Grievance & System Workflows
    console.log('\n--- Scenario I: Existing Functionality & Workflows ---');
    // Citizen files grievance
    const createGrievanceRes = await apiRequest('/grievances', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: {
        title: 'Water Leakage Near Main Hospital Road',
        description: 'Potable water distribution pipe has a steady leak on the main street.',
        category: 'Water Supply',
        location: {
          address: 'Hospital Road, Unit 6',
          city: 'Bhubaneswar',
          ward: 'Ward 10',
        },
      },
    });
    assert(createGrievanceRes.status === 201, 'Citizen can create a new grievance', createGrievanceRes);
    const grievanceId = createGrievanceRes.body.grievance?._id;

    if (grievanceId) {
      // Admin assigns grievance to officer
      const assignRes = await apiRequest(`/admin/grievances/${grievanceId}/assign`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { officerId: officerLoginRes.body.user.id },
      });
      assert(assignRes.status === 200, 'Admin can assign grievance to officer', assignRes);

      // Officer starts work / adds progress note
      const officerUpdateRes = await apiRequest(`/officer/grievances/${grievanceId}/start`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${officerToken}` },
        body: { note: 'Technician team dispatched to site' },
      });
      assert(officerUpdateRes.status === 200, 'Officer can update grievance status (start work)', officerUpdateRes);
    }

    console.log(`\n=== Verification Summary: ${passed} Passed, ${failed} Failed ===`);

    // Clean up created test entities
    await User.deleteMany({ email: /test.*@civicai\.gov/i });
    await User.deleteMany({ email: /admin\.created\.officer/i });
    if (grievanceId) {
      await Grievance.deleteOne({ _id: grievanceId });
    }

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
