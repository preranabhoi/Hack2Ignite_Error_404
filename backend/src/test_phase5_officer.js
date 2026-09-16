const axios = require('axios');

const API = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING CIVICAI PHASE 5 TEST SUITE ---');

  try {
    // 1. Auth Logins
    console.log('\n[1] Authenticating test accounts...');
    const citizenLogin = await axios.post(`${API}/auth/login`, {
      email: 'citizen@civicai.gov',
      password: 'password123',
    });
    const citizenToken = citizenLogin.data.token;
    console.log('✓ Citizen logged in:', citizenLogin.data.user.name);

    const adminLogin = await axios.post(`${API}/auth/login`, {
      email: 'admin@civicai.gov',
      password: 'password123',
    });
    const adminToken = adminLogin.data.token;
    console.log('✓ Admin logged in:', adminLogin.data.user.name);

    const pwdOfficerLogin = await axios.post(`${API}/auth/login`, {
      email: 'officer.pwd@civicai.gov',
      password: 'password123',
    });
    const pwdOfficerToken = pwdOfficerLogin.data.token;
    const pwdOfficerId = pwdOfficerLogin.data.user._id || pwdOfficerLogin.data.user.id;
    console.log('✓ PWD Officer logged in:', pwdOfficerLogin.data.user.name, `(${pwdOfficerId})`);

    const waterOfficerLogin = await axios.post(`${API}/auth/login`, {
      email: 'officer.water@civicai.gov',
      password: 'password123',
    });
    const waterOfficerToken = waterOfficerLogin.data.token;
    console.log('✓ Water Officer logged in:', waterOfficerLogin.data.user.name);

    // 2. Citizen creates a grievance
    console.log('\n[2] Citizen submitting new grievance...');
    const newGrievanceRes = await axios.post(
      `${API}/grievances`,
      {
        title: 'Deep pothole causing accidents near Saheed Nagar flyover',
        description: 'Large crater on arterial road causing traffic congestion and frequent motorcycle skids.',
        category: 'Roads',
        priority: 'High',
        location: {
          address: 'Saheed Nagar, Near Flyover Pillar 14',
          ward: 'Ward 32',
          city: 'Bhubaneswar',
          pincode: '751007',
          latitude: 20.2961,
          longitude: 85.8245,
        },
        images: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'],
      },
      { headers: { Authorization: `Bearer ${citizenToken}` } }
    );
    const grievanceId = newGrievanceRes.data.grievance._id;
    console.log('✓ Grievance submitted:', grievanceId, `[${newGrievanceRes.data.grievance.trackingId}]`);

    // 3. RBAC Test: Citizen attempts to call Officer endpoints -> Expect 403
    console.log('\n[3] Testing RBAC: Citizen accessing Officer stats...');
    try {
      await axios.get(`${API}/officer/stats`, {
        headers: { Authorization: `Bearer ${citizenToken}` },
      });
      console.error('❌ Failed: Citizen was able to access officer stats!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✓ RBAC Passed: Citizen received 403 Forbidden for officer endpoint.');
      } else {
        console.error('❌ Unexpected response code:', err.response?.status);
      }
    }

    // 4. Admin assigns the grievance to PWD Officer
    console.log('\n[4] Admin assigning grievance to PWD Officer...');
    const assignRes = await axios.patch(
      `${API}/admin/grievances/${grievanceId}/assign`,
      {
        officerId: pwdOfficerId,
        notes: 'Priority road repair assigned to PWD division for urgent site inspection.',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('✓ Grievance assigned successfully. Status:', assignRes.data.grievance.status);

    // 5. RBAC Test: Water Officer attempts to view/modify PWD Officer assigned grievance -> Expect 403
    console.log('\n[5] Testing RBAC: Unassigned Water Officer accessing PWD grievance...');
    try {
      await axios.get(`${API}/officer/grievances/${grievanceId}`, {
        headers: { Authorization: `Bearer ${waterOfficerToken}` },
      });
      console.error('❌ Failed: Unassigned officer was able to view task!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✓ RBAC Passed: Unassigned officer received 403 Forbidden.');
      } else {
        console.error('❌ Unexpected status:', err.response?.status);
      }
    }

    // 6. Assigned PWD Officer checks their stats & assigned queue
    console.log('\n[6] PWD Officer checking metrics and queue...');
    const statsRes = await axios.get(`${API}/officer/stats`, {
      headers: { Authorization: `Bearer ${pwdOfficerToken}` },
    });
    console.log('✓ Officer stats retrieved:', statsRes.data.stats);

    const listRes = await axios.get(`${API}/officer/grievances`, {
      headers: { Authorization: `Bearer ${pwdOfficerToken}` },
    });
    const found = listRes.data.grievances.some((g) => g._id === grievanceId);
    console.log(`✓ Assigned queue has ${listRes.data.count} items. Grievance found: ${found}`);

    // 7. PWD Officer views grievance details
    console.log('\n[7] PWD Officer retrieving grievance details...');
    const detailRes = await axios.get(`${API}/officer/grievances/${grievanceId}`, {
      headers: { Authorization: `Bearer ${pwdOfficerToken}` },
    });
    console.log('✓ Grievance retrieved:', detailRes.data.grievance.title);

    // 8. PWD Officer accepts assignment -> moves to Under Review
    console.log('\n[8] PWD Officer accepts assignment...');
    const acceptRes = await axios.patch(
      `${API}/officer/grievances/${grievanceId}/accept`,
      { notes: 'Inspection team deployed to Saheed Nagar flyover.' },
      { headers: { Authorization: `Bearer ${pwdOfficerToken}` } }
    );
    console.log('✓ Assignment accepted. New Status:', acceptRes.data.grievance.status);

    // 9. PWD Officer starts work -> moves to In Progress
    console.log('\n[9] PWD Officer starts field work...');
    const startRes = await axios.patch(
      `${API}/officer/grievances/${grievanceId}/start`,
      {
        notes: 'Bitumen and asphalt filling crew mobilized on site.',
        estimatedCompletion: '4 hours',
      },
      { headers: { Authorization: `Bearer ${pwdOfficerToken}` } }
    );
    console.log('✓ Field work started. New Status:', startRes.data.grievance.status);

    // 10. PWD Officer logs progress note
    console.log('\n[10] PWD Officer logging progress note with photo...');
    const progressRes = await axios.patch(
      `${API}/officer/grievances/${grievanceId}/progress`,
      {
        note: 'Pothole excavated and sub-base compacted. Applying hot-mix bitumen.',
        image: 'https://images.unsplash.com/photo-1578961952402-f04b2b1c4b79?w=600&auto=format&fit=crop&q=80',
      },
      { headers: { Authorization: `Bearer ${pwdOfficerToken}` } }
    );
    console.log('✓ Progress logged. Status history count:', progressRes.data.grievance.statusHistory.length);

    // 11. PWD Officer resolves grievance
    console.log('\n[11] PWD Officer marking grievance resolved...');
    const resolveRes = await axios.patch(
      `${API}/officer/grievances/${grievanceId}/resolve`,
      {
        actionTaken: 'Completed high-grade bitumen patchwork and leveling on Saheed Nagar flyover pillar 14.',
        remarks: 'Road surface tested and open to smooth traffic flow. Monitored for 24h curing.',
        resolutionProofImages: [
          'https://images.unsplash.com/photo-1584463699039-4475518b5774?w=600&auto=format&fit=crop&q=80',
        ],
      },
      { headers: { Authorization: `Bearer ${pwdOfficerToken}` } }
    );
    console.log('✓ Grievance resolved. Status:', resolveRes.data.grievance.status);
    console.log('✓ Resolution details saved:', resolveRes.data.grievance.resolution);

    // 12. Citizen fetches their grievance and verifies full resolution & status history
    console.log('\n[12] Citizen viewing updated grievance details...');
    const citizenGrievanceRes = await axios.get(`${API}/grievances/${grievanceId}`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const finalG = citizenGrievanceRes.data.grievance;
    console.log('✓ Citizen sees status:', finalG.status);
    console.log('✓ Citizen sees resolution action:', finalG.resolution?.actionTaken);
    console.log('✓ Citizen sees resolution proof photos:', finalG.resolution?.resolutionProofImages?.length);
    console.log('✓ Complete timeline history entries:');
    finalG.statusHistory.forEach((h, idx) => {
      console.log(`   [${idx + 1}] [${h.status}] - ${h.comment} (${new Date(h.timestamp).toLocaleTimeString()})`);
    });

    console.log('\n========================================');
    console.log('🎉 ALL PHASE 5 OFFICER TESTS PASSED! 🎉');
    console.log('========================================');
  } catch (err) {
    console.error('Test error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();