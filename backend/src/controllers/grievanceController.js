const { Grievance, CATEGORY_DEPARTMENT_MAP } = require('../models/Grievance');
const User = require('../models/User');

// @desc    Create a new grievance
// @route   POST /api/grievances
// @access  Private (Citizen)
const createGrievance = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      department,
      priority,
      location,
      images,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category',
      });
    }

    if (!location || !location.address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the incident address in location',
      });
    }

    // Determine department from category if not explicitly provided
    const assignedDepartment =
      department ||
      CATEGORY_DEPARTMENT_MAP[category] ||
      'General Administration';

    const grievance = new Grievance({
      title,
      description,
      category,
      department: assignedDepartment,
      priority: priority || 'Medium',
      status: 'Submitted',
      location: {
        address: location.address,
        latitude: location.latitude || null,
        longitude: location.longitude || null,
        landmark: location.landmark || '',
        city: location.city || 'Bhubaneswar',
        ward: location.ward || '',
        pincode: location.pincode || '',
      },
      images: Array.isArray(images) ? images : [],
      citizenId: req.user._id,
      statusHistory: [
        {
          status: 'Submitted',
          changedBy: req.user._id,
          comment: 'Grievance submitted successfully by citizen',
          timestamp: new Date(),
        },
      ],
    });

    const savedGrievance = await grievance.save();
    await savedGrievance.populate('citizenId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      grievance: savedGrievance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all grievances submitted by the logged-in citizen
// @route   GET /api/grievances/my
// @access  Private (Citizen)
const getMyGrievances = async (req, res, next) => {
  try {
    const { status, category, priority, search } = req.query;

    const query = { citizenId: req.user._id };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
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
        { 'location.landmark': searchRegex },
      ];
    }

    const grievances = await Grievance.find(query)
      .populate('assignedOfficer', 'name email department designation phone')
      .populate('resolution.resolvedBy', 'name email designation')
      .sort({ createdAt: -1 });

    // Quick summary stats for citizen dashboard
    const allCitizenGrievances = await Grievance.find({ citizenId: req.user._id });
    const stats = {
      total: allCitizenGrievances.length,
      submitted: allCitizenGrievances.filter((g) => g.status === 'Submitted').length,
      underReview: allCitizenGrievances.filter((g) => g.status === 'Under Review').length,
      assigned: allCitizenGrievances.filter((g) => g.status === 'Assigned').length,
      inProgress: allCitizenGrievances.filter((g) => g.status === 'In Progress').length,
      resolved: allCitizenGrievances.filter((g) => g.status === 'Resolved').length,
      rejected: allCitizenGrievances.filter((g) => g.status === 'Rejected').length,
    };

    res.json({
      success: true,
      count: grievances.length,
      stats,
      grievances,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get grievance by ID or tracking ID
// @route   GET /api/grievances/:id
// @access  Private (Citizen / Officer / Admin)
const getGrievanceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if ID is MongoDB ObjectId or custom trackingId
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { trackingId: id.toUpperCase() };

    const grievance = await Grievance.findOne(query)
      .populate('citizenId', 'name email phone address')
      .populate('assignedOfficer', 'name email department designation phone')
      .populate('statusHistory.changedBy', 'name role')
      .populate('resolution.resolvedBy', 'name role designation');

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found',
      });
    }

    // Role-based authorization: Citizens can ONLY view their own grievance
    if (
      req.user.role === 'citizen' &&
      grievance.citizenId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view grievances submitted by your account.',
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

// @desc    Update grievance details (Citizen allowed for 'Submitted' / 'Under Review' status)
// @route   PATCH /api/grievances/:id
// @access  Private (Citizen)
const updateGrievance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const grievance = await Grievance.findById(id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found',
      });
    }

    // Citizen can only update their own
    if (grievance.citizenId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own grievances.',
      });
    }

    // Only allow modification if status is 'Submitted' or 'Under Review'
    if (!['Submitted', 'Under Review'].includes(grievance.status)) {
      return res.status(400).json({
        success: false,
        message: `Grievance cannot be edited once it is in '${grievance.status}' status.`,
      });
    }

    const {
      title,
      description,
      category,
      priority,
      location,
      images,
    } = req.body;

    if (title) grievance.title = title;
    if (description) grievance.description = description;
    if (category) {
      grievance.category = category;
      grievance.department =
        CATEGORY_DEPARTMENT_MAP[category] || grievance.department;
    }
    if (priority) grievance.priority = priority;
    if (location) {
      grievance.location = {
        ...grievance.location.toObject(),
        ...location,
      };
    }
    if (images && Array.isArray(images)) {
      grievance.images = images;
    }

    // Add entry to status history for update
    grievance.statusHistory.push({
      status: grievance.status,
      changedBy: req.user._id,
      comment: 'Citizen updated grievance details',
      timestamp: new Date(),
    });

    const updated = await grievance.save();
    await updated.populate('citizenId', 'name email phone');

    res.json({
      success: true,
      message: 'Grievance updated successfully',
      grievance: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/withdraw grievance
// @route   DELETE /api/grievances/:id
// @access  Private (Citizen)
const deleteGrievance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const grievance = await Grievance.findById(id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found',
      });
    }

    // Check ownership
    if (
      req.user.role === 'citizen' &&
      grievance.citizenId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot delete this grievance.',
      });
    }

    // Allow citizen to delete ONLY if status is 'Submitted'
    if (req.user.role === 'citizen' && grievance.status !== 'Submitted') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete grievance once processing has started (Current status: ${grievance.status}).`,
      });
    }

    await Grievance.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Grievance deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGrievance,
  getMyGrievances,
  getGrievanceById,
  updateGrievance,
  deleteGrievance,
};
