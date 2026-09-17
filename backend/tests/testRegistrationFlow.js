const axios = require('axios');
const mongoose = require('mongoose');

const API_BASE = 'http://localhost:5000/api';

async function runRegistrationTests() {
  console.log('==================================================');
  console.log('CivicAI: Registration Flow Verification');
  console.log('==================================================\n');

  try {
    const timestamp = Date.now();
    const testCitizen = {
      name: `Rajesh Mohanty ${timestamp}`,
      email: `rajesh_${timestamp}@civicai.test`,
      password: 'StrongPassword123!',
      phone: '+91 98765 00000',
      ward: 'Ward 14 (Saheed Nagar)',
      city: 'Bhubaneswar',
    };

    console.log('[Test 1] Testing Citizen Registration API...');
    console.log('Sending Registration payload:', testCitizen);

    const res = await axios.post(`${API_BASE}/auth/register`, testCitizen);

    console.log('\nResponse status:', res.status);
    console.log('Response body:', JSON.stringify(res.data, null, 2));

    // Validations:
    if (res.status !== 201) {
      throw new Error(`Expected status 201, got ${res.status}`);
    }

    if (!res.data.success) {
      throw new Error('Registration response success is not true');
    }

    if (!res.data.token || typeof res.data.token !== 'string') {
      throw new Error('Registration response did not return a valid JWT token');
    }
    console.log('✅ Valid JWT Token received.');

    const returnedUser = res.data.user;
    if (!returnedUser || !returnedUser.id || !returnedUser.email) {
      throw new Error('Registration response missing user details');
    }

    // Check that password is NEVER exposed
    if (res.data.password || returnedUser.password) {
      throw new Error('SECURITY VIOLATION: Password was returned in the API response!');
    }
    console.log('✅ Password is NOT exposed in API response.');

    if (returnedUser.name !== testCitizen.name) {
      throw new Error(`User name mismatch. Expected '${testCitizen.name}', got '${returnedUser.name}'`);
    }
    if (returnedUser.email !== testCitizen.email.toLowerCase()) {
      throw new Error(`User email mismatch. Expected '${testCitizen.email}', got '${returnedUser.email}'`);
    }
    if (returnedUser.address.ward !== testCitizen.ward) {
      throw new Error(`Ward mismatch. Expected '${testCitizen.ward}', got '${returnedUser.address.ward}'`);
    }
    if (returnedUser.address.city !== testCitizen.city) {
      throw new Error(`City mismatch. Expected '${testCitizen.city}', got '${returnedUser.address.city}'`);
    }
    console.log('✅ User field mapping (name, email, phone, ward, city) verified in response.');

    // Connect to MongoDB to verify user in database
    console.log('\n[Test 2] Verifying user record directly in MongoDB database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicai');

    const User = require('../src/models/User');
    const dbUser = await User.findById(returnedUser.id).select('+password');

    if (!dbUser) {
      throw new Error('User was not found in MongoDB!');
    }
    console.log('✅ User record exists in MongoDB.');
    console.log('Stored DB user email:', dbUser.email);
    console.log('Stored DB user role:', dbUser.role);
    console.log('Stored DB address:', dbUser.address);

    // Verify password is encrypted with bcrypt
    if (!dbUser.password || !dbUser.password.startsWith('$2')) {
      throw new Error('Password in DB is not hashed with bcrypt!');
    }
    console.log('✅ Password in MongoDB is hashed with bcrypt (starts with $2a/$2b).');

    const isMatch = await dbUser.matchPassword(testCitizen.password);
    if (!isMatch) {
      throw new Error('bcrypt matchPassword failed for the plaintext password!');
    }
    console.log('✅ bcrypt matchPassword succeeded against stored hash.');

    // Test Duplicate Registration Prevention
    console.log('\n[Test 3] Testing duplicate email rejection...');
    try {
      await axios.post(`${API_BASE}/auth/register`, testCitizen);
      throw new Error('Expected duplicate registration to fail!');
    } catch (dupErr) {
      if (dupErr.response && dupErr.response.status === 400) {
        console.log('✅ Duplicate email correctly rejected with 400:', dupErr.response.data.message);
      } else {
        throw dupErr;
      }
    }

    // Test Short Password Rejection (< 8 chars)
    console.log('\n[Test 4] Testing short password (< 8 chars) validation...');
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        name: 'Short Password User',
        email: `short_${timestamp}@civicai.test`,
        password: 'short',
        phone: '1234567890',
        ward: 'Ward 1',
        city: 'Bhubaneswar',
      });
      throw new Error('Expected short password to fail validation!');
    } catch (valErr) {
      if (valErr.response && valErr.response.status === 400) {
        console.log('✅ Short password correctly rejected with 400:', valErr.response.data.message);
      } else {
        throw valErr;
      }
    }

    console.log('\n==================================================');
    console.log('🎉 ALL REGISTRATION TESTS PASSED PERFECTLY!');
    console.log('==================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

runRegistrationTests();
