const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('==================================================');
  console.log('CivicAI Phase 11: AI Citizen Assistant Verification');
  console.log('==================================================\n');

  try {
    // 1. Authenticate Citizen
    console.log('[Test 1] Authenticating citizen user...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'citizen@civicai.gov',
      password: 'password123',
    });

    if (!loginRes.data.success || !loginRes.data.token) {
      throw new Error('Failed to login as citizen');
    }
    const token = loginRes.data.token;
    console.log('✅ Citizen authenticated successfully. User:', loginRes.data.user.name);

    const client = axios.create({
      baseURL: API_BASE,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 2. Test Waste Management query
    console.log('\n[Test 2] Querying Citizen Assistant: "There is garbage piling up near my college."');
    const res1 = await client.post('/grievances/assistant-chat', {
      messages: [
        {
          role: 'user',
          content: 'There is garbage piling up near my college gate for the last 4 days.',
        },
      ],
    });

    console.log('Response Status:', res1.status);
    console.log('Assistant Data:', JSON.stringify(res1.data.data, null, 2));

    if (!res1.data.success || !res1.data.data) {
      throw new Error('Test 2 failed: Missing response data');
    }

    const d1 = res1.data.data;
    if (d1.suggestedCategory !== 'Waste Management') {
      console.warn(`⚠️ Warning: Expected 'Waste Management', got '${d1.suggestedCategory}'`);
    } else {
      console.log('✅ Correctly categorized as "Waste Management"');
    }

    if (d1.draftGrievance && d1.draftGrievance.title && d1.draftGrievance.category) {
      console.log('✅ Grievance draft generated:', d1.draftGrievance);
    } else {
      throw new Error('Test 2 failed: Missing draft grievance object');
    }

    // 3. Test Road Pothole query
    console.log('\n[Test 3] Querying Citizen Assistant: "Dangerous deep pothole on MG Road near flyover."');
    const res2 = await client.post('/grievances/assistant-chat', {
      messages: [
        {
          role: 'user',
          content: 'Dangerous deep pothole on MG Road near flyover causing vehicle skids.',
        },
      ],
    });

    const d2 = res2.data.data;
    console.log('Assistant Reply:', d2.reply.slice(0, 120) + '...');
    console.log('Suggested Category:', d2.suggestedCategory);
    console.log('Draft Object:', d2.draftGrievance);

    if (d2.suggestedCategory !== 'Roads') {
      console.warn(`⚠️ Warning: Expected 'Roads', got '${d2.suggestedCategory}'`);
    } else {
      console.log('✅ Correctly categorized as "Roads"');
    }

    // 4. Test Multi-turn Conversation
    console.log('\n[Test 4] Multi-turn conversation test...');
    const res3 = await client.post('/grievances/assistant-chat', {
      messages: [
        { role: 'user', content: 'The streetlights on Ward 12 main avenue are not working.' },
        {
          role: 'assistant',
          content: 'This appears to be a Street Lighting issue. Can you provide the pole number or landmark?',
        },
        { role: 'user', content: 'It is near pole #45 opposite the community health center.' },
      ],
    });

    const d3 = res3.data.data;
    console.log('Multi-turn Reply:', d3.reply.slice(0, 120) + '...');
    console.log('Multi-turn Draft:', d3.draftGrievance);
    if (d3.suggestedCategory === 'Street Lighting' || d3.draftGrievance?.category === 'Street Lighting') {
      console.log('✅ Multi-turn correctly retained "Street Lighting"');
    }

    // 5. Test Bad Request / Empty Messages
    console.log('\n[Test 5] Testing Bad Request validation (empty messages array)...');
    try {
      await client.post('/grievances/assistant-chat', { messages: [] });
      throw new Error('Test 5 failed: Should have returned 400');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log('✅ Correctly rejected invalid input with 400 Bad Request:', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 6. Test Unauthenticated Access
    console.log('\n[Test 6] Testing Unauthenticated Access rejection...');
    try {
      await axios.post(`${API_BASE}/grievances/assistant-chat`, {
        messages: [{ role: 'user', content: 'Hello' }],
      });
      throw new Error('Test 6 failed: Should have returned 401');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('✅ Correctly rejected unauthenticated request with 401 Unauthorized');
      } else {
        throw err;
      }
    }

    console.log('\n==================================================');
    console.log('🎉 ALL PHASE 11 TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
    process.exit(1);
  }
}

runTests();
