const { Grievance, CATEGORY_DEPARTMENT_MAP } = require('../models/Grievance');
const User = require('../models/User');

// @desc    Get aggregate statistics and chart data for Admin Dashboard
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res, next) => {
  try {
    const allGrievances = await Grievance.find({});

    const total = allGrievances.length;
    const submitted = allGrievances.filter((g) => g.status === 'Submitted').length;
    const underReview = allGrievances.filter((g) => g.status === 'Under Review').length;
    const assigned = allGrievances.filter((g) => g.status === 'Assigned').length;
    const inProgress = allGrievances.filter((g) => g.status === 'In Progress').length;
    const resolved = allGrievances.filter((g) => g.status === 'Resolved').length;
    const rejected = allGrievances.filter((g) => g.status === 'Rejected').length;

    const criticalHigh = allGrievances.filter(
      (g) => g.priority === 'Critical' || g.priority === 'High'
    ).length;

    // 1. Group by Category
    const categoryMap = {};
    allGrievances.forEach((g) => {
      categoryMap[g.category] = (categoryMap[g.category] || 0) + 1;
    });
    const byCategory = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      count: categoryMap[cat],
      percentage: total > 0 ? ((categoryMap[cat] / total) * 100).toFixed(1) : 0,
    }));

    // 2. Group by Department
    const deptMap = {};
    allGrievances.forEach((g) => {
      deptMap[g.department] = (deptMap[g.department] || 0) + 1;
    });
    const byDepartment = Object.keys(deptMap).map((dept) => ({
      department: dept,
      count: deptMap[dept],
      percentage: total > 0 ? ((deptMap[dept] / total) * 100).toFixed(1) : 0,
    }));

    // 3. Group by Status
    const byStatus = [
      { status: 'Submitted', count: submitted, color: '#3b82f6' },
      { status: 'Under Review', count: underReview, color: '#8b5cf6' },
      { status: 'Assigned', count: assigned, color: '#0284c7' },
      { status: 'In Progress', count: inProgress, color: '#d97706' },
      { status: 'Resolved', count: resolved, color: '#10b981' },
      { status: 'Rejected', count: rejected, color: '#ef4444' },
    ];

    // 4. Group by Priority
    const byPriority = [
      { priority: 'Critical', count: allGrievances.filter((g) => g.priority === 'Critical').length, color: '#ef4444' },
      { priority: 'High', count: allGrievances.filter((g) => g.priority === 'High').length, color: '#f59e0b' },
      { priority: 'Medium', count: allGrievances.filter((g) => g.priority === 'Medium').length, color: '#0284c7' },
      { priority: 'Low', count: allGrievances.filter((g) => g.priority === 'Low').length, color: '#10b981' },
    ];

    // 5. Volume Trend over last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
      
      const countForDay = allGrievances.filter((g) => {
        const gDate = new Date(g.createdAt).toISOString().split('T')[0];
        return gDate === dateStr;
      }).length;

      last7Days.push({
        date: dateStr,
        label: displayLabel,
        count: countForDay,
      });
    }

    // Officer and citizen counts
    const totalCitizens = await User.countDocuments({ role: 'citizen' });
    const totalOfficers = await User.countDocuments({ role: 'officer' });

    res.json({
      success: true,
      stats: {
        total,
        submitted,
        underReview,
        assigned,
        inProgress,
        resolved,
        rejected,
        criticalHigh,
        totalCitizens,
        totalOfficers,
        byCategory,
        byDepartment,
        byStatus,
        byPriority,
        overTime: last7Days,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all grievances for Admin with filtering, search, and pagination
// @route   GET /api/admin/grievances
// @access  Private (Admin)
const getAllGrievances = async (req, res, next) => {
  try {
    const {
      status,
      category,
      department,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { trackingId: searchRegex },
        { 'location.address': searchRegex },
        { 'location.ward': searchRegex },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Grievance.countDocuments(query);

    const grievances = await Grievance.find(query)
      .populate('citizenId', 'name email phone address')
      .populate('assignedOfficer', 'name email department designation phone employeeId availabilityStatus')
      .populate('resolution.resolvedBy', 'name role designation')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: grievances.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      grievances,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get officer directory with active workload counts
// @route   GET /api/admin/officers
// @access  Private (Admin)
const getOfficersDirectory = async (req, res, next) => {
  try {
    const { department } = req.query;
    const filter = { role: 'officer', isActive: true };

    if (department && department !== 'All') {
      filter.department = department;
    }

    const officers = await User.find(filter).select('-password');

    // Attach current active workload count to each officer
    const officersWithWorkload = await Promise.all(
      officers.map(async (officer) => {
        const activeCount = await Grievance.countDocuments({
          assignedOfficer: officer._id,
          status: { $in: ['Assigned', 'In Progress'] },
        });

        const officerObj = officer.toObject();
        officerObj.activeGrievancesCount = activeCount;
        return officerObj;
      })
    );

    res.json({
      success: true,
      count: officersWithWorkload.length,
      officers: officersWithWorkload,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign officer to a grievance
// @route   PATCH /api/admin/grievances/:id/assign
// @access  Private (Admin)
const assignOfficer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { officerId, notes } = req.body;

    if (!officerId) {
      return res.status(400).json({ success: false, message: 'Please select an officer to assign' });
    }

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    const officer = await User.findById(officerId);
    if (!officer || officer.role !== 'officer') {
      return res.status(400).json({ success: false, message: 'Invalid officer selected' });
    }

    grievance.assignedOfficer = officer._id;

    // Automatically advance status to 'Assigned' if currently 'Submitted' or 'Under Review'
    const previousStatus = grievance.status;
    if (['Submitted', 'Under Review'].includes(grievance.status)) {
      grievance.status = 'Assigned';
    }

    // Add status history entry
    grievance.statusHistory.push({
      status: grievance.status,
      changedBy: req.user._id,
      comment: notes || `Admin assigned grievance to ${officer.name} (${officer.department})`,
      timestamp: new Date(),
    });

    const updated = await grievance.save();
    await updated.populate([
      { path: 'citizenId', select: 'name email phone address' },
      { path: 'assignedOfficer', select: 'name email department designation phone employeeId' },
      { path: 'statusHistory.changedBy', select: 'name role' },
    ]);

    res.json({
      success: true,
      message: `Grievance assigned to ${officer.name} successfully`,
      grievance: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change grievance status & add administrative remarks
// @route   PATCH /api/admin/grievances/:id/status
// @access  Private (Admin)
const updateGrievanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comment, remarks, actionTaken } = req.body;

    const allowedStatuses = [
      'Submitted',
      'Under Review',
      'Assigned',
      'In Progress',
      'Resolved',
      'Rejected',
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    const oldStatus = grievance.status;
    grievance.status = status;

    if (status === 'Resolved') {
      grievance.resolution = {
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
        actionTaken: actionTaken || comment || 'Administrative verification and resolution completed.',
        remarks: remarks || '',
        resolutionProofImages: [],
      };
    }

    grievance.statusHistory.push({
      status,
      changedBy: req.user._id,
      comment: comment || `Admin updated status from ${oldStatus} to ${status}`,
      timestamp: new Date(),
    });

    const updated = await grievance.save();
    await updated.populate([
      { path: 'citizenId', select: 'name email phone address' },
      { path: 'assignedOfficer', select: 'name email department designation phone' },
      { path: 'statusHistory.changedBy', select: 'name role' },
      { path: 'resolution.resolvedBy', select: 'name role designation' },
    ]);

    res.json({
      success: true,
      message: `Grievance status updated to ${status}`,
      grievance: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin override AI / Citizen Category, Department & Priority
// @route   PATCH /api/admin/grievances/:id/override
// @access  Private (Admin)
const overrideGrievance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, department, priority, overrideReason } = req.body;

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    const changes = [];

    if (category && category !== grievance.category) {
      changes.push(`Category (${grievance.category} -> ${category})`);
      grievance.category = category;
      if (!department) {
        grievance.department = CATEGORY_DEPARTMENT_MAP[category] || grievance.department;
      }
    }

    if (department && department !== grievance.department) {
      changes.push(`Department (${grievance.department} -> ${department})`);
      grievance.department = department;
    }

    if (priority && priority !== grievance.priority) {
      changes.push(`Priority (${grievance.priority} -> ${priority})`);
      grievance.priority = priority;
    }

    const auditNote =
      changes.length > 0
        ? `Admin Override: ${changes.join(', ')}. ${overrideReason ? `Reason: ${overrideReason}` : ''}`
        : `Admin reviewed grievance configuration. ${overrideReason || ''}`;

    grievance.statusHistory.push({
      status: grievance.status,
      changedBy: req.user._id,
      comment: auditNote,
      timestamp: new Date(),
    });

    const updated = await grievance.save();
    await updated.populate([
      { path: 'citizenId', select: 'name email phone address' },
      { path: 'assignedOfficer', select: 'name email department designation phone' },
      { path: 'statusHistory.changedBy', select: 'name role' },
    ]);

    res.json({
      success: true,
      message: 'Grievance attributes overridden successfully by admin',
      grievance: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllGrievances,
  getOfficersDirectory,
  assignOfficer,
  updateGrievanceStatus,
  overrideGrievance,
};
