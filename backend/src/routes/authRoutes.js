const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  getOfficers,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { authRateLimit } = require('../middleware/securityMiddleware');

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/officers', protect, authorize('admin', 'officer'), getOfficers);

module.exports = router;
