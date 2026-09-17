const { Grievance, CATEGORY_DEPARTMENT_MAP } = require('../models/Grievance');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { recordAudit } = require('../services/auditService');
const { escapeRegex, validateImages, validateText } = require('../middleware/securityMiddleware');

// @desc    Get aggregate statistics and chart data for Admin Dashboard
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res, next) => {
  try {
    const { range = '7d', startDate, endDate, department = 'All' } = req.query;
    const now = new Date();
    let periodStart = new Date(now);
    let periodEnd = new Date(now);

    if (range === 'custom' && (!startDate || !endDate)) {
      return res.status(400).json({ success: false, message: 'Custom analytics range requires startDate and endDate.' });
    }

    if (range === 'custom') {
      periodStart = new Date(`${startDate}T00:00:00.000Z`);
      periodEnd = new Date(`${endDate}T23:59:59.999Z`);
    } else {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[range] || 7;
      periodStart.setDate(periodStart.getDate() - days);
    }

    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime()) || periodStart >= periodEnd) {
      return res.status(400).json({ success: false, message: 'Invalid analytics date range.' });
    }

    const filter = { createdAt: { $gte: periodStart, $lte: periodEnd } };
    if (department && department !== 'All') filter.department = department;

    const previousDuration = periodEnd.getTime() - periodStart.getTime();
    const previousFilter = {
      ...filter,
      createdAt: {
        $gte: new Date(periodStart.getTime() - previousDuration),
        $lt: periodStart,
      },
    };
    const colors = {
      Submitted: '#3b82f6', 'Under Review': '#8b5cf6', Assigned: '#0284c7',
      'In Progress': '#d97706', Resolved: '#10b981', Rejected: '#ef4444',
      Critical: '#ef4444', High: '#f59e0b', Medium: '#0284c7', Low: '#10b981',
    };

    const [analytics] = await Grievance.aggregate([
      { $match: filter },
      { $facet: {
        totals: [{ $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $not: [{ $in: ['$status', ['Resolved', 'Rejected']] }] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $in: ['$priority', ['High', 'Critical']] }, 1, 0] } },
          resolutionDays: { $push: { $cond: [
            { $and: [{ $eq: ['$status', 'Resolved'] }, { $ne: ['$resolution.resolvedAt', null] }] },
            { $divide: [{ $subtract: ['$resolution.resolvedAt', '$createdAt'] }, 86400000] },
            null,
          ] } },
        } }],
        status: [{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        category: [{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        department: [{ $group: {
          _id: '$department',
          count: { $sum: 1 },
          pending: { $sum: { $cond: [{ $not: [{ $in: ['$status', ['Resolved', 'Rejected']] }] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
        } }, { $sort: { pending: -1, count: -1 } }],
        priority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        overTime: [{ $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 },
        } }, { $sort: { _id: 1 } }],
        resolutionTrend: [{ $match: { status: 'Resolved', 'resolution.resolvedAt': { $ne: null } } }, { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$resolution.resolvedAt' } },
          averageDays: { $avg: { $divide: [{ $subtract: ['$resolution.resolvedAt', '$createdAt'] }, 86400000] } },
          resolvedCount: { $sum: 1 },
        } }, { $sort: { _id: 1 } }],
      } },
    ]);

    const previous = await Grievance.aggregate([
      { $match: previousFilter },
      { $group: { _id: null, total: { $sum: 1 }, roads: { $sum: { $cond: [{ $eq: ['$category', 'Roads'] }, 1, 0] } } } },
    ]);
    const totals = analytics.totals[0] || { total: 0, resolved: 0, pending: 0, highPriority: 0, resolutionDays: [] };
    const validResolutionDays = (totals.resolutionDays || []).filter((value) => value !== null);
    const total = totals.total || 0;
    const toDistribution = (items, key) => items.map((item) => ({
      [key]: item._id,
      count: item.count,
      percentage: total ? Number(((item.count / total) * 100).toFixed(1)) : 0,
      color: colors[item._id],
    }));
    const currentRoads = analytics.category.find((item) => item._id === 'Roads')?.count || 0;
    const previousTotal = previous[0]?.total || 0;
    const previousRoads = previous[0]?.roads || 0;
    const roadChange = previousRoads ? Math.round(((currentRoads - previousRoads) / previousRoads) * 100) : null;
    const insights = [];
    if (roadChange !== null && roadChange !== 0) insights.push(`Road-related complaints ${roadChange > 0 ? 'increased' : 'decreased'} ${Math.abs(roadChange)}% compared with the previous period.`);
    if (totals.highPriority > 0) insights.push(`${totals.highPriority} high or critical grievances need active follow-up.`);
    if (analytics.department[0]) insights.push(`${analytics.department[0]._id} currently carries the highest workload with ${analytics.department[0].pending} pending grievances.`);
    if (insights.length === 0) insights.push('No major trend requiring attention was detected for this period.');

    res.json({ success: true, stats: {
      total,
      submitted: analytics.status.find((item) => item._id === 'Submitted')?.count || 0,
      underReview: analytics.status.find((item) => item._id === 'Under Review')?.count || 0,
      assigned: analytics.status.find((item) => item._id === 'Assigned')?.count || 0,
      inProgress: analytics.status.find((item) => item._id === 'In Progress')?.count || 0,
      rejected: analytics.status.find((item) => item._id === 'Rejected')?.count || 0,
      resolved: totals.resolved || 0,
      resolutionRate: total ? Number(((totals.resolved / total) * 100).toFixed(1)) : 0,
      averageResolutionDays: validResolutionDays.length ? Number((validResolutionDays.reduce((sum, value) => sum + value, 0) / validResolutionDays.length).toFixed(1)) : 0,
      pending: totals.pending || 0,
      highPriority: totals.highPriority || 0,
      byStatus: toDistribution(analytics.status, 'status'),
      byCategory: toDistribution(analytics.category, 'category'),
      byDepartment: analytics.department.map((item) => ({ department: item._id, count: item.count, pending: item.pending, resolved: item.resolved, percentage: total ? Number(((item.count / total) * 100).toFixed(1)) : 0 })),
      byPriority: toDistribution(analytics.priority, 'priority'),
      overTime: analytics.overTime.map((item) => ({ date: item._id, label: item._id, count: item.count })),
      resolutionTrend: analytics.resolutionTrend.map((item) => ({ date: item._id, averageDays: Number(item.averageDays.toFixed(1)), resolvedCount: item.resolvedCount })),
      insights,
      comparison: { previousTotal, roadChange },
      period: { start: periodStart, end: periodEnd, department },
    } });
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
      const searchRegex = new RegExp(escapeRegex(search.trim().slice(0, 100)), 'i');
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
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Grievance.countDocuments(query);

    const grievances = await Grievance.find(query)
      .populate('citizenId', 'name email phone address')
      .populate('assignedOfficer', 'name email department designation phone employeeId availabilityStatus')
      .populate('resolution.resolvedBy', 'name role designation')
      .populate('duplicateDetection.relatedGrievanceIds', 'trackingId title status location')
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

// @desc    Create a new Field Officer
// @route   POST /api/admin/officers
// @access  Private (Admin)
const createOfficer = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      employeeId,
      department,
      officerType,
      designation,
      ward,
      city,
      status = 'active',
      address,
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
      return res.status(400).json({ success: false, message: 'Please provide a valid full name (2-100 characters).' });
    }

    if (!email || typeof email !== 'string' || email.length > 254) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Please provide a password (minimum 8 characters).' });
    }

    if (!department || typeof department !== 'string' || department.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please select a department.' });
    }

    if (!employeeId || typeof employeeId !== 'string' || employeeId.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide an employee ID.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedEmpId = employeeId.trim().toUpperCase();

    // Check unique email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    // Check unique employeeId
    const existingEmpId = await User.findOne({ employeeId: normalizedEmpId });
    if (existingEmpId) {
      return res.status(400).json({ success: false, message: 'An officer with this Employee ID already exists.' });
    }

    const officerAddress = {
      city: typeof city === 'string' && city.trim() ? city.trim() : (address?.city || 'Bhubaneswar'),
      ward: typeof ward === 'string' && ward.trim() ? ward.trim() : (address?.ward || ''),
      pincode: address?.pincode || '',
    };

    const isActive = status !== 'inactive';

    const officer = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'officer', // Strictly forced to officer; never allows admin creation
      department: department.trim(),
      officerType: officerType && typeof officerType === 'string' && officerType.trim() ? officerType.trim() : 'Field Officer',
      designation: designation && typeof designation === 'string' && designation.trim() ? designation.trim() : 'Field Officer',
      employeeId: normalizedEmpId,
      phone: phone && typeof phone === 'string' ? phone.trim() : '',
      address: officerAddress,
      isActive,
      status: isActive ? 'active' : 'inactive',
    });

    await recordAudit({
      action: 'officer_create',
      actorId: req.user._id,
      details: { officerId: officer._id, name: officer.name, department: officer.department, employeeId: officer.employeeId },
    });

    res.status(201).json({
      success: true,
      message: 'Field Officer account created successfully.',
      officer: {
        id: officer._id,
        _id: officer._id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        department: officer.department,
        officerType: officer.officerType,
        designation: officer.designation,
        employeeId: officer.employeeId,
        phone: officer.phone,
        address: officer.address,
        status: officer.status,
        isActive: officer.isActive,
        createdAt: officer.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get officer directory with search, filters, and grievance workload counts
// @route   GET /api/admin/officers
// @access  Private (Admin)
const getOfficersDirectory = async (req, res, next) => {
  try {
    const { department, officerType, status, search } = req.query;
    const filter = { role: 'officer' };

    if (department && department !== 'All') {
      filter.department = department;
    }

    if (officerType && officerType !== 'All') {
      filter.officerType = officerType;
    }

    if (status && status !== 'All') {
      if (status.toLowerCase() === 'active') {
        filter.$or = [{ status: 'active' }, { isActive: true }];
      } else if (status.toLowerCase() === 'inactive') {
        filter.$or = [{ status: 'inactive' }, { isActive: false }];
      }
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(escapeRegex(search.trim().slice(0, 100)), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
        { designation: searchRegex },
        { officerType: searchRegex },
        { 'address.ward': searchRegex },
        { 'address.city': searchRegex },
      ];
    }

    const officers = await User.find(filter)
      .select('name email role department designation officerType employeeId phone address status isActive availabilityStatus createdAt')
      .sort({ createdAt: -1 });

    // Attach workload counts to each officer
    const officersWithWorkload = await Promise.all(
      officers.map(async (officer) => {
        const totalAssigned = await Grievance.countDocuments({ assignedOfficer: officer._id });
        const activeCount = await Grievance.countDocuments({
          assignedOfficer: officer._id,
          status: { $in: ['Assigned', 'In Progress', 'Under Review'] },
        });
        const resolvedCount = await Grievance.countDocuments({
          assignedOfficer: officer._id,
          status: 'Resolved',
        });

        const officerObj = officer.toObject();
        officerObj.id = officer._id;
        officerObj.totalAssigned = totalAssigned;
        officerObj.activeGrievancesCount = activeCount;
        officerObj.resolvedCount = resolvedCount;
        officerObj.status = officer.isActive !== false ? 'active' : 'inactive';
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

// @desc    Get single officer details with assigned grievance stats & recent list
// @route   GET /api/admin/officers/:id
// @access  Private (Admin)
const getOfficerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const officer = await User.findOne({ _id: id, role: 'officer' })
      .select('name email role department designation officerType employeeId phone address status isActive availabilityStatus createdAt');

    if (!officer) {
      return res.status(404).json({ success: false, message: 'Field Officer not found.' });
    }

    const totalAssigned = await Grievance.countDocuments({ assignedOfficer: officer._id });
    const inProgress = await Grievance.countDocuments({ assignedOfficer: officer._id, status: 'In Progress' });
    const pending = await Grievance.countDocuments({ assignedOfficer: officer._id, status: 'Assigned' });
    const underReview = await Grievance.countDocuments({ assignedOfficer: officer._id, status: 'Under Review' });
    const resolved = await Grievance.countDocuments({ assignedOfficer: officer._id, status: 'Resolved' });

    const recentGrievances = await Grievance.find({ assignedOfficer: officer._id })
      .select('trackingId title category priority status createdAt location.ward location.address')
      .populate('citizenId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      officer: {
        ...officer.toObject(),
        id: officer._id,
        status: officer.isActive !== false ? 'active' : 'inactive',
      },
      stats: {
        totalAssigned,
        inProgress,
        pending,
        underReview,
        resolved,
      },
      recentGrievances,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update officer details
// @route   PATCH /api/admin/officers/:id
// @access  Private (Admin)
const updateOfficer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      employeeId,
      department,
      officerType,
      designation,
      ward,
      city,
      status,
      isActive,
      password,
    } = req.body;

    const officer = await User.findOne({ _id: id, role: 'officer' });
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Field Officer not found.' });
    }

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      officer.name = name.trim();
    }

    if (email && typeof email === 'string') {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== officer.email) {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
          return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
        }
        officer.email = normalizedEmail;
      }
    }

    if (employeeId && typeof employeeId === 'string') {
      const normalizedEmpId = employeeId.trim().toUpperCase();
      if (normalizedEmpId !== officer.employeeId) {
        const existingEmp = await User.findOne({ employeeId: normalizedEmpId });
        if (existingEmp) {
          return res.status(400).json({ success: false, message: 'An officer with this Employee ID already exists.' });
        }
        officer.employeeId = normalizedEmpId;
      }
    }

    if (department && typeof department === 'string') {
      officer.department = department.trim();
    }

    if (officerType && typeof officerType === 'string') {
      officer.officerType = officerType.trim();
    }

    if (designation && typeof designation === 'string') {
      officer.designation = designation.trim();
    }

    if (phone !== undefined) {
      officer.phone = typeof phone === 'string' ? phone.trim() : '';
    }

    if (ward !== undefined || city !== undefined) {
      officer.address = {
        ...officer.address,
        ward: ward !== undefined ? String(ward).trim() : officer.address.ward,
        city: city !== undefined ? String(city).trim() : officer.address.city,
      };
    }

    if (status !== undefined) {
      officer.status = status === 'active' ? 'active' : 'inactive';
      officer.isActive = officer.status === 'active';
    } else if (isActive !== undefined) {
      officer.isActive = Boolean(isActive);
      officer.status = officer.isActive ? 'active' : 'inactive';
    }

    if (password && typeof password === 'string' && password.length >= 8) {
      officer.password = password; // pre-save hook will hash it
    }

    // Role MUST remain officer
    officer.role = 'officer';

    const updatedOfficer = await officer.save();

    await recordAudit({
      action: 'officer_update',
      actorId: req.user._id,
      details: { officerId: updatedOfficer._id, name: updatedOfficer.name, department: updatedOfficer.department },
    });

    res.json({
      success: true,
      message: 'Officer profile updated successfully.',
      officer: {
        id: updatedOfficer._id,
        _id: updatedOfficer._id,
        name: updatedOfficer.name,
        email: updatedOfficer.email,
        role: updatedOfficer.role,
        department: updatedOfficer.department,
        officerType: updatedOfficer.officerType,
        designation: updatedOfficer.designation,
        employeeId: updatedOfficer.employeeId,
        phone: updatedOfficer.phone,
        address: updatedOfficer.address,
        status: updatedOfficer.status,
        isActive: updatedOfficer.isActive,
        updatedAt: updatedOfficer.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle or set officer status (Active/Inactive)
// @route   PATCH /api/admin/officers/:id/status
// @access  Private (Admin)
const updateOfficerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    const officer = await User.findOne({ _id: id, role: 'officer' });
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Field Officer not found.' });
    }

    let newStatus = 'active';
    if (status) {
      newStatus = status === 'active' ? 'active' : 'inactive';
    } else if (typeof isActive === 'boolean') {
      newStatus = isActive ? 'active' : 'inactive';
    } else {
      newStatus = officer.isActive ? 'inactive' : 'active';
    }

    officer.status = newStatus;
    officer.isActive = newStatus === 'active';
    await officer.save();

    await recordAudit({
      action: 'officer_status_change',
      actorId: req.user._id,
      details: { officerId: officer._id, newStatus },
    });

    res.json({
      success: true,
      message: `Officer account has been ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
      officer: {
        id: officer._id,
        _id: officer._id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        department: officer.department,
        status: officer.status,
        isActive: officer.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft-delete / deactivate an officer
// @route   DELETE /api/admin/officers/:id
// @access  Private (Admin)
const deleteOfficer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const officer = await User.findOne({ _id: id, role: 'officer' });
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Field Officer not found.' });
    }

    officer.status = 'inactive';
    officer.isActive = false;
    await officer.save();

    await recordAudit({
      action: 'officer_deactivate',
      actorId: req.user._id,
      details: { officerId: officer._id, name: officer.name },
    });

    res.json({
      success: true,
      message: `Officer ${officer.name} deactivated successfully. Historical grievance assignments remain intact.`,
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

    const previousOfficerId = grievance.assignedOfficer;
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
    await recordAudit({
      action: 'assignment',
      actorId: req.user._id,
      grievanceId: grievance._id,
      details: { officerId: officer._id, previousOfficerId, notes: notes || '' },
    });
    await createNotification({
      userId: grievance.citizenId,
      title: 'Grievance assigned',
      message: `${grievance.trackingId} has been assigned to the ${officer.department} department.`,
      type: 'assignment',
      relatedGrievanceId: grievance._id,
    });
    await createNotification({
      userId: officer._id,
      title: 'New grievance assigned',
      message: `${grievance.trackingId}: ${grievance.title}`,
      type: 'assignment',
      relatedGrievanceId: grievance._id,
    });
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

    const textError = validateText(comment, 'Comment', 1000) || validateText(remarks, 'Remarks', 2000) || validateText(actionTaken, 'Action taken', 2000);
    const imageError = validateImages(req.body.resolutionProofImages);
    if (textError || imageError) return res.status(400).json({ success: false, message: textError || imageError });

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
    await recordAudit({
      action: 'status_change',
      actorId: req.user._id,
      grievanceId: grievance._id,
      details: { from: oldStatus, to: status, comment: comment || '' },
    });
    await createNotification({
      userId: grievance.citizenId,
      title: `Grievance status: ${status}`,
      message: `${grievance.trackingId} moved from ${oldStatus} to ${status}.`,
      type: status === 'Resolved' ? 'resolution' : 'status_change',
      relatedGrievanceId: grievance._id,
    });
    if (grievance.assignedOfficer && comment) {
      await createNotification({
        userId: grievance.assignedOfficer,
        title: 'Admin added a grievance note',
        message: comment,
        type: 'admin_note',
        relatedGrievanceId: grievance._id,
      });
    }
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

    if (category && !Object.prototype.hasOwnProperty.call(CATEGORY_DEPARTMENT_MAP, category)) {
      return res.status(400).json({ success: false, message: 'Invalid grievance category.' });
    }
    if (department && !['Public Works & Roads', 'Waste Management', 'Water Supply & Sanitation', 'Electricity & Power', 'Health & Environment', 'Traffic & Transport', 'General Administration', 'None'].includes(department)) {
      return res.status(400).json({ success: false, message: 'Invalid department.' });
    }
    if (priority && !['Low', 'Medium', 'High', 'Critical'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority.' });
    }
    if (validateText(overrideReason, 'Override reason', 1000)) {
      return res.status(400).json({ success: false, message: 'Override reason is too long.' });
    }

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
    if (changes.some((change) => change.startsWith('Priority'))) {
      await recordAudit({ action: 'priority_override', actorId: req.user._id, grievanceId: grievance._id, details: { changes, reason: overrideReason || '' } });
    }
    if (changes.some((change) => change.startsWith('Department'))) {
      await recordAudit({ action: 'department_override', actorId: req.user._id, grievanceId: grievance._id, details: { changes, reason: overrideReason || '' } });
    }
    if (changes.some((change) => change.startsWith('Priority')) && grievance.assignedOfficer) {
      await createNotification({
        userId: grievance.assignedOfficer,
        title: 'Grievance priority changed',
        message: `${grievance.trackingId} priority was updated by an administrator.`,
        type: 'priority_change',
        relatedGrievanceId: grievance._id,
      });
    }
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
  createOfficer,
  getOfficerById,
  updateOfficer,
  updateOfficerStatus,
  deleteOfficer,
  assignOfficer,
  updateGrievanceStatus,
  overrideGrievance,
};
