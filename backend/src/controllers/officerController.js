const { Grievance } = require('../models/Grievance');
const User = require('../models/User');

// @desc    Get dashboard metrics for logged-in Officer
// @route   GET /api/officer/stats
// @access  Private (Officer)
const getOfficerStats = async (req, res, next) => {
  try {
    const officerId = req.user._id;
    const assignedGrievances = await Grievance.find({ assignedOfficer: officerId });

    const totalAssigned = assignedGrievances.length;
    const pending = assignedGrievances.filter((g) => g.status === 'Assigned').length;
    const inProgress = assignedGrievances.filter((g) => g.status === 'In Progress').length;
    const underReview = assignedGrievances.filter((g) => g.status === 'Under Review').length;
    const resolved = assignedGrievances.filter((g) => g.status === 'Resolved').length;
    const criticalHigh = assignedGrievances.filter(
      (g) => (g.priority === 'Critical' || g.priority === 'High') && g.status !== 'Resolved'
    ).length;

    res.json({
      success: true,
      stats: {
        totalAssigned,
        pending,
        inProgress,
        underReview,
        resolved,
        criticalHigh,
        officer: {
          name: req.user.name,
          department: req.user.department,
          designation: req.user.designation,
          employeeId: req.user.employeeId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all grievances assigned to logged-in officer
// @route   GET /api/officer/grievances
// @access  Private (Officer)
const getOfficerGrievances = async (req, res, next) => {
  try {
    const officerId = req.user._id;
    const { status, priority, search, sortOrder = 'desc' } = req.query;

    const query = { assignedOfficer: officerId };

    if (status && status !== 'All') {
      query.status = status;
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

    const sortOption = { createdAt: sortOrder === 'asc' ? 1 : -1 };

    const grievances = await Grievance.find(query)
      .populate('citizenId', 'name email phone address')
      .populate('resolution.resolvedBy', 'name role designation')
      .sort(sortOption);

    // Compute status counts for quick tab badges
    const allAssigned = await Grievance.find({ assignedOfficer: officerId });
    const counts = {
      all: allAssigned.length,
      assigned: allAssigned.filter((g) => g.status === 'Assigned').length,
      inProgress: allAssigned.filter((g) => g.status === 'In Progress').length,
      underReview: allAssigned.filter((g) => g.status === 'Under Review').length,
      resolved: allAssigned.filter((g) => g.status === 'Resolved').length,
    };

    res.json({
      success: true,
      count: grievances.length,
      counts,
      grievances,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific grievance assigned to officer
// @route   GET /api/officer/grievances/:id
// @access  Private (Officer)
const getOfficerGrievanceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const officerId = req.user._id;

    // Support ObjectId or trackingId
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { trackingId: id.toUpperCase() };

    const grievance = await Grievance.findOne(query)
      .populate('citizenId', 'name email phone address')
      .populate('assignedOfficer', 'name email department designation phone employeeId')
      .populate('statusHistory.changedBy', 'name role designation')
      .populate('resolution.resolvedBy', 'name role designation');

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    // Role check: Officer can ONLY access grievances assigned to them
    if (
      !grievance.assignedOfficer ||
      grievance.assignedOfficer._id.toString() !== officerId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view grievances assigned to your account.',
      });
    }

    res.json({
      success: true,
      grievance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Officer accepts / acknowledges assignment
// @route   PATCH /api/officer/grievances/:id/accept
// @access  Private (Officer)
const acceptAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const officerId = req.user._id;
    const { notes } = req.body;

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    if (
      !grievance.assignedOfficer ||
      grievance.assignedOfficer.toString() !== officerId.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized for this grievance' });
    }

    // Acknowledge assignment: If status is 'Assigned', keep as 'Assigned' or move to 'Under Review'
    grievance.status = 'Under Review';

    grievance.statusHistory.push({
      status: 'Under Review',
      changedBy: officerId,
      comment: notes || `Field Officer ${req.user.name} accepted the task and initiated inspection review.`,
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
      message: 'Assignment accepted. Status set to Under Review.',
      grievance: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Officer starts work on grievance (Transitions to In Progress)
// @route   PATCH /api/officer/grievances/:id/start
// @access  Private (Officer)
const startWork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const officerId = req.user._id;
    const { notes, estimatedCompletion } = req.body;

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    if (
      !grievance.assignedOfficer ||
      grievance.assignedOfficer.toString() !== officerId.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized for this grievance' });
    }

    grievance.status = 'In Progress';

    const commentText = notes
      ? `Field work started: ${notes}`
      : `Officer ${req.user.name} mobilized repair crew on site. Work is now In Progress.${estimatedCompletion ? ` Estimated completion: ${estimatedCompletion}` : ''}`;

    grievance.statusHistory.push({
      status: 'In Progress',
      changedBy: officerId,
      comment: commentText,
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
      message: 'Work status transitioned to In Progress',
      grievance: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Officer adds work progress note & site evidence image
// @route   PATCH /api/officer/grievances/:id/progress
// @access  Private (Officer)
const addProgressNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const officerId = req.user._id;
    const { note, image } = req.body;

    if (!note || note.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a progress note' });
    }

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    if (
      !grievance.assignedOfficer ||
      grievance.assignedOfficer.toString() !== officerId.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized for this grievance' });
    }

    if (image && typeof image === 'string') {
      grievance.images.push(image);
    }

    grievance.statusHistory.push({
      status: grievance.status,
      changedBy: officerId,
      comment: `Progress Update: ${note.trim()}`,
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
      message: 'Progress update logged successfully',
      grievance: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Officer resolves grievance (Requires resolution description, optional proof images)
// @route   PATCH /api/officer/grievances/:id/resolve
// @access  Private (Officer)
const resolveGrievance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const officerId = req.user._id;
    const { actionTaken, remarks, resolutionProofImages } = req.body;

    if (!actionTaken || actionTaken.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Resolution description (action taken) is required to resolve grievance.',
      });
    }

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    if (
      !grievance.assignedOfficer ||
      grievance.assignedOfficer.toString() !== officerId.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized for this grievance' });
    }

    grievance.status = 'Resolved';
    grievance.resolution = {
      resolvedBy: officerId,
      resolvedAt: new Date(),
      actionTaken: actionTaken.trim(),
      remarks: remarks ? remarks.trim() : '',
      resolutionProofImages: Array.isArray(resolutionProofImages) ? resolutionProofImages : [],
    };

    grievance.statusHistory.push({
      status: 'Resolved',
      changedBy: officerId,
      comment: `Issue Resolved by Officer ${req.user.name}. Action: ${actionTaken.trim()}`,
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
      message: 'Grievance resolved and verified successfully',
      grievance: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOfficerStats,
  getOfficerGrievances,
  getOfficerGrievanceById,
  acceptAssignment,
  startWork,
  addProgressNote,
  resolveGrievance,
};