const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllGrievances,
  getOfficersDirectory,
  assignOfficer,
  updateGrievanceStatus,
  overrideGrievance,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes strictly protected with 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/grievances', getAllGrievances);
router.get('/officers', getOfficersDirectory);
router.patch('/grievances/:id/assign', assignOfficer);
router.patch('/grievances/:id/status', updateGrievanceStatus);
router.patch('/grievances/:id/override', overrideGrievance);

module.exports = router;
