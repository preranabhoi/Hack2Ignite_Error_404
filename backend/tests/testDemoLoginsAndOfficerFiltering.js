const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

const DEMO_ACCOUNTS = [
  {
    roleName: 'Citizen',
    displayName: 'Aarav Sharma',
    email: 'citizen@civicai.gov',
    password: 'password123',
    expectedRole: 'citizen',
    expectedDept: 'None',
  },
  {
    roleName: 'Field Officer (PWD)',
    displayName: 'Rajesh Verma (PWD Officer)',
    email: 'officer.pwd@civicai.gov',
    password: 'password123',
    expectedRole: 'officer',
    expectedDept: 'Public Works & Roads',
    expectedCategory: 'Roads',
  },
  {
    roleName: 'Field Officer (Water & Sanitation)',
    displayName: 'Sunita Mohanty (Water & Sanitation)',
    email: 'officer.water@civicai.gov',
    password: 'password123',
    expectedRole: 'officer',
    expectedDept: 'Water Supply & Sanitation',
    expectedCategory: 'Water Supply',
  },
  {
    roleName: 'Field Officer (Electricity & Power)',
    displayName: 'Amitabh Sen (Electricity & Power)',
    email: 'officer.electricity@civicai.gov',
    password: 'password123',
    expectedRole: 'officer',
    expectedDept: 'Electricity & Power',
    expectedCategory: 'Electricity',
  },
  {
    roleName: 'Field Officer (Waste Management)',
    displayName: 'Kavita Das (Waste Management)',
    email: 'officer.waste@civicai.gov',
    password: 'password123',
    expectedRole: 'officer',
    expectedDept: 'Waste Management',
    expectedCategory: 'Waste Management',
  },
  {
    roleName: 'Administrator',
    displayName: 'Dr. Vikramaditya (Admin)',
    email: 'admin@civicai.gov',
    password: 'password123',
    expectedRole: 'admin',
    expectedDept: 'General Administration',
  },
];

async function runDemoLoginVerification() {
  console.log('================================================================');
  console.log('CivicAI: Demo Logins & Officer Grievance Filtering Verification');
  console.log('================================================================\n');

  const tokens = {};
  const officerGrievanceMap = {};

  try {
    // 1. Test Authentication for all 6 demo accounts
    console.log('--- [Phase 1: Demo Account Authentication] ---');
    for (const acc of DEMO_ACCOUNTS) {
      console.log(`\nTesting login for: ${acc.roleName} (${acc.email})`);
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: acc.email,
        password: acc.password,
      });

      if (!res.data.success || !res.data.token) {
        throw new Error(`Login failed for ${acc.email}`);
      }

      if (res.data.password || res.data.user.password) {
        throw new Error(`SECURITY VIOLATION: Password returned in response for ${acc.email}`);
      }

      if (res.data.user.role !== acc.expectedRole) {
        throw new Error(`Role mismatch for ${acc.email}. Expected '${acc.expectedRole}', got '${res.data.user.role}'`);
      }

      tokens[acc.email] = res.data.token;
      console.log(`✅ ${acc.displayName} authenticated successfully.`);
      console.log(`   User ID: ${res.data.user.id}, Role: ${res.data.user.role}, Department: ${res.data.user.department}`);
    }

    // 2. Test Officer Dashboard Stats & Grievances Filtering
    console.log('\n--- [Phase 2: Officer-Specific Grievances Filtering] ---');
    const officerAccounts = DEMO_ACCOUNTS.filter((a) => a.expectedRole === 'officer');

    for (const off of officerAccounts) {
      const client = axios.create({
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${tokens[off.email]}` },
      });

      // Check stats
      const statsRes = await client.get('/officer/stats');
      if (!statsRes.data.success || !statsRes.data.stats) {
        throw new Error(`Failed to fetch officer stats for ${off.email}`);
      }
      console.log(`\n[${off.roleName}] Stats: Total Assigned: ${statsRes.data.stats.totalAssigned}, In Progress: ${statsRes.data.stats.inProgress}, Pending: ${statsRes.data.stats.pending}`);

      // Check grievances
      const gRes = await client.get('/officer/grievances');
      if (!gRes.data.success || !Array.isArray(gRes.data.grievances)) {
        throw new Error(`Failed to fetch grievances for ${off.email}`);
      }

      officerGrievanceMap[off.email] = gRes.data.grievances;

      console.log(`✅ ${off.roleName} sees ${gRes.data.grievances.length} assigned grievance(s):`);
      for (const g of gRes.data.grievances) {
        console.log(`   • [${g.trackingId}] ${g.title} (Category: ${g.category}, Dept: ${g.department}, Status: ${g.status})`);
        if (g.department !== off.expectedDept && g.category !== off.expectedCategory) {
          console.warn(`   ⚠️ Warning: Grievance department '${g.department}' does not match officer expected '${off.expectedDept}'`);
        }
      }

      if (gRes.data.grievances.length === 0) {
        throw new Error(`Expected at least 1 seeded assigned grievance for ${off.roleName}!`);
      }
    }

    // 3. Test Officer Cross-Access Denial (Role isolation check)
    console.log('\n--- [Phase 3: Cross-Officer Isolation Verification] ---');
    const pwdGrievance = officerGrievanceMap['officer.pwd@civicai.gov'][0];
    const waterClient = axios.create({
      baseURL: API_BASE,
      headers: { Authorization: `Bearer ${tokens['officer.water@civicai.gov']}` },
    });

    console.log(`Testing Water Officer attempting to access PWD Grievance (${pwdGrievance.trackingId})...`);
    try {
      await waterClient.get(`/officer/grievances/${pwdGrievance._id}`);
      throw new Error('Water Officer was unexpectedly allowed to view PWD Grievance!');
    } catch (crossErr) {
      if (crossErr.response && crossErr.response.status === 403) {
        console.log('✅ Correctly blocked with 403 Forbidden:', crossErr.response.data.message);
      } else {
        throw crossErr;
      }
    }

    // 4. Test Citizen & Admin Portal
    console.log('\n--- [Phase 4: Citizen & Admin Access Verification] ---');
    const citizenClient = axios.create({
      baseURL: API_BASE,
      headers: { Authorization: `Bearer ${tokens['citizen@civicai.gov']}` },
    });
    const citizenGrievances = await citizenClient.get('/grievances/my');
    console.log(`✅ Citizen sees ${citizenGrievances.data.count} filed grievances.`);

    const adminClient = axios.create({
      baseURL: API_BASE,
      headers: { Authorization: `Bearer ${tokens['admin@civicai.gov']}` },
    });
    const adminGrievances = await adminClient.get('/admin/grievances');
    console.log(`✅ Administrator sees total ${adminGrievances.data.count} citywide grievances.`);

    console.log('\n================================================================');
    console.log('🎉 ALL DEMO LOGINS & OFFICER FILTERING TESTS PASSED!');
    console.log('================================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
    if (err.response?.data) {
      console.error('Error details:', err.response.data);
    }
    process.exit(1);
  }
}

runDemoLoginVerification();
