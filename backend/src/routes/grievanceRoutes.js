const express = require('express');
const router = express.Router();
const {
  createGrievance,
  getMyGrievances,
  getGrievanceById,
  updateGrievance,
  deleteGrievance,
  reanalyzeGrievance,
} = require('../controllers/grievanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Citizen grievance routes
router.post('/', protect, authorize('citizen'), createGrievance);
router.get('/my', protect, authorize('citizen'), getMyGrievances);
router.get('/:id', protect, getGrievanceById);
router.post('/:id/analyze', protect, reanalyzeGrievance);
router.patch('/:id', protect, authorize('citizen'), updateGrievance);
router.delete('/:id', protect, authorize('citizen'), deleteGrievance);

module.exports = router;
