const express = require('express');
const router = express.Router();
const {
  getOfficerStats,
  getOfficerGrievances,
  getOfficerGrievanceById,
  acceptAssignment,
  startWork,
  addProgressNote,
  resolveGrievance,
} = require('../controllers/officerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All officer routes strictly protected with 'officer' role
router.use(protect);
router.use(authorize('officer'));

router.get('/stats', getOfficerStats);
router.get('/grievances', getOfficerGrievances);
router.get('/grievances/:id', getOfficerGrievanceById);
router.patch('/grievances/:id/accept', acceptAssignment);
router.patch('/grievances/:id/start', startWork);
router.patch('/grievances/:id/progress', addProgressNote);
router.patch('/grievances/:id/resolve', resolveGrievance);

module.exports = router;