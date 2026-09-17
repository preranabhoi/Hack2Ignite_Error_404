const { Grievance, CATEGORY_DEPARTMENT_MAP } = require('../models/Grievance');
const User = require('../models/User');
const {
  analyzeGrievance,
  generateResolutionRecommendation,
  detectDuplicateGrievances,
  chatWithCitizenAssistant,
} = require('../services/aiService');
const { createNotification, notifyAdmins } = require('../services/notificationService');
const { aiRateLimit } = require('../middleware/securityMiddleware');
const { validateImages, validateText, escapeRegex } = require('../middleware/securityMiddleware');
const { recordAudit } = require('../services/auditService');

// @desc    Create a new grievance & run lightweight AI analysis
// @route   POST /api/grievances
// @access  Private (Citizen)
const createGrievance = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      location,
      images,
    } = req.body;

    if (!title || !description || !category || typeof title !== 'string' || typeof description !== 'string') {
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

    const textError = validateText(title, 'Title', 150) || validateText(description, 'Description', 3000);
    const imageError = validateImages(images);
    if (textError || imageError || (priority && !['Low', 'Medium', 'High', 'Critical'].includes(priority))) {
      return res.status(400).json({ success: false, message: textError || imageError || 'Invalid priority.' });
    }

    const assignedDepartment = CATEGORY_DEPARTMENT_MAP[category] || 'General Administration';

    const grievance = new Grievance({
      title,
      description,
      category,
      department: assignedDepartment,
      priority: priority || 'Medium',
      status: 'Submitted',
      location: {
        address: String(location.address).trim().slice(0, 300),
        latitude: Number.isFinite(Number(location.latitude)) ? Number(location.latitude) : null,
        longitude: Number.isFinite(Number(location.longitude)) ? Number(location.longitude) : null,
        landmark: String(location.landmark || '').trim().slice(0, 150),
        city: String(location.city || 'Bhubaneswar').trim().slice(0, 100),
        ward: String(location.ward || '').trim().slice(0, 100),
        pincode: String(location.pincode || '').trim().slice(0, 12),
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

    // 1. Initial save
    const savedGrievance = await grievance.save();

    // 2. Perform lightweight AI analysis
    try {
      const aiResult = await analyzeGrievance({
        title: savedGrievance.title,
        description: savedGrievance.description,
        category: savedGrievance.category,
        priority: savedGrievance.priority,
        location: savedGrievance.location,
      });

      savedGrievance.aiAnalysis = aiResult;
      await savedGrievance.save();
    } catch (aiErr) {
      console.error('[CivicAI Controller] AI analysis failed, maintaining fallback:', aiErr.message);
      savedGrievance.aiAnalysis = {
        category: savedGrievance.category,
        department: savedGrievance.department,
        priority: savedGrievance.priority,
        summary: `Citizen grievance reported: ${savedGrievance.title}`,
        suggestedAction: `Assign to ${savedGrievance.department} for review.`,
        status: 'failed',
        confidenceScore: 0.5,
        analyzedAt: new Date(),
      };
      await savedGrievance.save();
    }

    // Duplicate detection is advisory and must never block grievance submission.
    let duplicateDetection = null;
    try {
      const recentCandidates = await Grievance.find({
        _id: { $ne: savedGrievance._id },
        category: savedGrievance.category,
        status: { $nin: ['Resolved', 'Rejected'] },
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('title description category department location status');

      duplicateDetection = await detectDuplicateGrievances({
        grievance: savedGrievance,
        candidates: recentCandidates,
      });

      if (duplicateDetection) {
        savedGrievance.duplicateDetection = duplicateDetection;
        await savedGrievance.save();
      }
    } catch (duplicateError) {
      console.warn('[CivicAI Controller] Duplicate detection skipped:', duplicateError.message);
    }

    await savedGrievance.populate('citizenId', 'name email phone');
    await savedGrievance.populate('duplicateDetection.relatedGrievanceIds', 'trackingId title status location');

    await createNotification({
      userId: savedGrievance.citizenId._id,
      title: 'Grievance submitted',
      message: `Your grievance ${savedGrievance.trackingId} was submitted successfully.`,
      type: 'submission',
      relatedGrievanceId: savedGrievance._id,
    });
    await notifyAdmins({
      title: 'New grievance received',
      message: `${savedGrievance.trackingId}: ${savedGrievance.title}`,
      type: 'submission',
      relatedGrievanceId: savedGrievance._id,
    });
    if (['High', 'Critical'].includes(savedGrievance.priority)) {
      await notifyAdmins({
        title: `${savedGrievance.priority} grievance requires attention`,
        message: `${savedGrievance.trackingId} is an unresolved ${savedGrievance.priority.toLowerCase()} priority grievance.`,
        type: 'admin_alert',
        relatedGrievanceId: savedGrievance._id,
      });
    }

    res.status(201).json({
      success: true,
      message: duplicateDetection?.isPotentialDuplicate
        ? 'Grievance submitted. Similar complaints may already exist.'
        : 'Grievance submitted and analyzed successfully',
      grievance: savedGrievance,
      duplicateDetection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record an admin decision on a duplicate recommendation
// @route   PATCH /api/admin/grievances/:id/duplicate-review
// @access  Private (Admin)
const reviewDuplicateDetection = async (req, res, next) => {
  try {
    const { decision, comment = '' } = req.body;
    if (!['ignored', 'merged'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be ignored or merged.' });
    }

    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    if (!grievance.duplicateDetection?.isPotentialDuplicate) {
      return res.status(400).json({ success: false, message: 'No pending duplicate recommendation exists.' });
    }

    grievance.duplicateDetection.reviewStatus = decision;
    grievance.duplicateDetection.reviewedBy = req.user._id;
    grievance.duplicateDetection.reviewedAt = new Date();
    grievance.duplicateDetection.reviewComment = comment.trim();
    grievance.statusHistory.push({
      status: grievance.status,
      changedBy: req.user._id,
      comment: decision === 'merged'
        ? 'Admin confirmed related grievance records. Original records and citizen histories were preserved.'
        : 'Admin dismissed the possible duplicate recommendation.',
      timestamp: new Date(),
    });

    const updated = await grievance.save();
    if (decision === 'merged') {
      await recordAudit({ action: 'grievance_merge', actorId: req.user._id, grievanceId: grievance._id, details: { relatedGrievanceIds: grievance.duplicateDetection.relatedGrievanceIds, comment } });
    }
    await updated.populate('duplicateDetection.relatedGrievanceIds', 'trackingId title status location');

    res.json({ success: true, message: `Duplicate recommendation marked as ${decision}.`, grievance: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Re-run AI analysis on existing grievance
// @route   POST /api/grievances/:id/analyze
// @access  Private (Citizen / Officer / Admin)
const reanalyzeGrievance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const grievance = await Grievance.findById(id);

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    // Role check: Citizen can only re-analyze their own
    if (req.user.role === 'citizen' && grievance.citizenId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (req.user.role === 'officer' && (!grievance.assignedOfficer || grievance.assignedOfficer.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Only the assigned officer can re-analyze this grievance.' });
    }

    const aiResult = await analyzeGrievance({
      title: grievance.title,
      description: grievance.description,
      category: grievance.category,
      priority: grievance.priority,
      location: grievance.location,
    });

    grievance.aiAnalysis = aiResult;
    const updated = await grievance.save();

    res.json({
      success: true,
      message: 'AI analysis updated successfully',
      aiAnalysis: updated.aiAnalysis,
      grievance: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate an advisory AI resolution recommendation
// @route   POST /api/grievances/:id/resolution-recommendation
// @access  Private (Admin / assigned Officer)
const generateGrievanceResolutionRecommendation = async (req, res, next) => {
  try {
    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    const isAssignedOfficer =
      req.user.role === 'officer' &&
      grievance.assignedOfficer &&
      grievance.assignedOfficer.toString() === req.user._id.toString();

    if (req.user.role !== 'admin' && !isAssignedOfficer) {
      return res.status(403).json({
        success: false,
        message: 'Only an administrator or the assigned officer can generate a recommendation.',
      });
    }

    const recommendation = await generateResolutionRecommendation({
      title: grievance.title,
      description: grievance.description,
      category: grievance.category,
      department: grievance.department,
      priority: grievance.priority,
      location: grievance.location,
      status: grievance.status,
      statusHistory: grievance.statusHistory,
      resolution: grievance.resolution,
    });

    res.json({
      success: true,
      message: 'AI resolution recommendation generated. Review before taking action.',
      recommendation,
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
      const searchRegex = new RegExp(escapeRegex(search.trim().slice(0, 100)), 'i');
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
      .populate('resolution.resolvedBy', 'name role designation')
      .populate('duplicateDetection.relatedGrievanceIds', 'trackingId title status location');

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

    const textError = validateText(title, 'Title', 150) || validateText(description, 'Description', 3000);
    const imageError = validateImages(images);
    if (textError || imageError || (priority && !['Low', 'Medium', 'High', 'Critical'].includes(priority))) {
      return res.status(400).json({ success: false, message: textError || imageError || 'Invalid priority.' });
    }

    if (title !== undefined) grievance.title = title.trim();
    if (description !== undefined) grievance.description = description.trim();
    if (category) {
      grievance.category = category;
      grievance.department =
        CATEGORY_DEPARTMENT_MAP[category] || grievance.department;
    }
    if (priority) grievance.priority = priority;
    if (location) {
      const allowedLocationFields = ['address', 'landmark', 'city', 'ward', 'pincode', 'latitude', 'longitude'];
      for (const field of allowedLocationFields) {
        if (location[field] !== undefined) grievance.location[field] = location[field];
      }
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

// @desc    Citizen AI Assistant conversation & grievance drafting
// @route   POST /api/grievances/assistant-chat
// @access  Private (Citizen / Authenticated Users)
const chatCitizenAssistant = async (req, res, next) => {
  try {
    const { messages = [] } = req.body;

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20 || messages.some((message) =>
      !message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || message.content.length > 2000
    )) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one message for the assistant.',
      });
    }

    const assistantResult = await chatWithCitizenAssistant({
      messages,
      user: req.user,
    });

    res.json({
      success: true,
      message: 'Assistant response generated successfully',
      data: assistantResult,
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
  reanalyzeGrievance,
  generateGrievanceResolutionRecommendation,
  reviewDuplicateDetection,
  chatCitizenAssistant,
};
