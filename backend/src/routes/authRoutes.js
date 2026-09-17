const express = require('express');
const router = express.Router();
const {
  registerCitizen,
  registerOfficer,
  registerAdmin,
  login,
  loginCitizen,
  loginOfficer,
  loginAdmin,
  getMe,
  updateProfile,
  getOfficers,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { authRateLimit } = require('../middleware/securityMiddleware');

router.post('/register', authRateLimit, registerCitizen);
router.post('/register/citizen', authRateLimit, registerCitizen);
router.post('/register-officer', authRateLimit, registerOfficer);
router.post('/register/officer', authRateLimit, registerOfficer);
router.post('/register-admin', authRateLimit, registerAdmin);
router.post('/register/admin', authRateLimit, registerAdmin);
router.post('/login', authRateLimit, login);
router.post('/login/citizen', authRateLimit, loginCitizen);
router.post('/login/officer', authRateLimit, loginOfficer);
router.post('/login/admin', authRateLimit, loginAdmin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/officers', protect, authorize('admin', 'officer'), getOfficers);

module.exports = router;
