const express = require('express');
const router = express.Router();
const { chatCitizenAssistant } = require('../controllers/grievanceController');
const { optionalAuth } = require('../middleware/authMiddleware');
const { aiRateLimit } = require('../middleware/securityMiddleware');

// @route   POST /api/ai/citizen-guide
// @desc    Citizen AI Guide chatbot endpoint (Supports authenticated & public guidance)
// @access  Public / Authenticated
router.post('/citizen-guide', optionalAuth, aiRateLimit, chatCitizenAssistant);

module.exports = router;
