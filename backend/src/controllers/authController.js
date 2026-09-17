const jwt = require('jsonwebtoken');
const User = require('../models/User');
const getJwtSecret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return process.env.JWT_SECRET;
};

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
      algorithm: 'HS256',
    }
  );
};

// @desc    Register a new citizen
// @route   POST /api/auth/register/citizen (and POST /api/auth/register)
// @access  Public
const registerCitizen = async (req, res, next) => {
  try {
    const { name, email, password, phone, ward, city, address } = req.body;

    if (
      !name ||
      typeof name !== 'string' ||
      name.trim().length < 2 ||
      name.length > 100 ||
      !email ||
      typeof email !== 'string' ||
      email.length > 254 ||
      !password ||
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password (minimum 8 characters)',
      });
    }

    // Check if user already exists
    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    const userAddress = {
      city: typeof city === 'string' ? city.trim() : (address?.city || ''),
      ward: typeof ward === 'string' ? ward.trim() : (address?.ward || ''),
      pincode: address?.pincode || '',
    };

    // Citizens register publicly. Security invariant: role is always citizen
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'citizen',
      department: 'None',
      phone: typeof phone === 'string' ? phone.trim() : '',
      address: userAddress,
      status: 'active',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        address: user.address,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new Field Officer with official registration code
// @route   POST /api/auth/register/officer
// @access  Public (Protected by Officer Registration Code)
const registerOfficer = async (req, res, next) => {
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
      registrationCode,
    } = req.body;

    if (
      !name ||
      typeof name !== 'string' ||
      name.trim().length < 2 ||
      !email ||
      typeof email !== 'string' ||
      !password ||
      typeof password !== 'string' ||
      password.length < 8 ||
      !employeeId ||
      typeof employeeId !== 'string' ||
      !department ||
      typeof department !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, password (min 8 chars), employee ID, and department.',
      });
    }

    // Verify official officer registration code
    const validOfficerCode = process.env.OFFICER_REGISTRATION_CODE || 'OFFICER-CIVIC-2026';
    if (!registrationCode || registrationCode.trim() !== validOfficerCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid officer registration code. Please provide an authorized official code.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const existingEmp = await User.findOne({ employeeId: employeeId.trim(), role: 'officer' });
    if (existingEmp) {
      return res.status(400).json({
        success: false,
        message: 'An officer with this Employee ID already exists.',
      });
    }

    const officer = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'officer',
      department: department.trim(),
      officerType: officerType ? officerType.trim() : 'Field Officer',
      designation: designation ? designation.trim() : 'Field Officer',
      employeeId: employeeId.trim(),
      phone: phone ? phone.trim() : '',
      address: {
        city: city ? city.trim() : 'Bhubaneswar',
        ward: ward ? ward.trim() : '',
      },
      status: 'active',
      isActive: true,
    });

    const token = generateToken(officer._id);

    res.status(201).json({
      success: true,
      message: 'Field Officer account registered successfully.',
      token,
      user: {
        id: officer._id,
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
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new Administrator with administrator setup code
// @route   POST /api/auth/register/admin
// @access  Public (Protected by Administrator Setup Code)
const registerAdmin = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      adminId,
      administratorId,
      employeeId,
      setupCode,
      registrationCode,
    } = req.body;

    if (
      !name ||
      typeof name !== 'string' ||
      name.trim().length < 2 ||
      !email ||
      typeof email !== 'string' ||
      !password ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password (min 8 chars).',
      });
    }

    // 1. Verify administrator setup code configuration
    const expectedSetupCode = process.env.ADMIN_SETUP_CODE || process.env.ADMIN_REGISTRATION_CODE;
    if (!expectedSetupCode) {
      return res.status(500).json({
        success: false,
        message: 'Administrator setup is not configured.',
      });
    }

    // 2. Validate submitted setup code
    const submittedCode = setupCode !== undefined ? setupCode : registrationCode;
    if (!submittedCode || typeof submittedCode !== 'string' || !submittedCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Administrator Setup Code is required.',
      });
    }

    if (submittedCode.trim() !== expectedSetupCode) {
      return res.status(403).json({
        success: false,
        message: 'Invalid administrator setup code. Access denied.',
      });
    }

    // 3. Duplicate checks
    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An administrator account with this email already exists.',
      });
    }

    const effectiveAdminId = (administratorId || adminId || employeeId || '').trim();
    if (effectiveAdminId) {
      const existingId = await User.findOne({ employeeId: effectiveAdminId });
      if (existingId) {
        return res.status(400).json({
          success: false,
          message: 'An administrator with this Administrator ID already exists.',
        });
      }
    }

    // 4. Create admin account - role is strictly forced to 'admin'
    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'admin',
      department: 'General Administration',
      designation: 'System Administrator',
      employeeId: effectiveAdminId || 'ADM-001',
      phone: typeof phone === 'string' ? phone.trim() : '',
      status: 'active',
      isActive: true,
    });

    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Administrator account registered successfully.',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department,
        designation: admin.designation,
        employeeId: admin.employeeId,
        phone: admin.phone,
        status: admin.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || email.length > 254 ||
      !password || typeof password !== 'string' || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user with password explicitly included
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive || user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact the administrator.',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        officerType: user.officerType || 'Field Officer',
        designation: user.designation || 'Field Officer',
        employeeId: user.employeeId || '',
        phone: user.phone,
        address: user.address,
        status: user.status || 'active',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        officerType: user.officerType || 'Field Officer',
        designation: user.designation || 'Field Officer',
        employeeId: user.employeeId || '',
        phone: user.phone,
        address: user.address,
        status: user.status || 'active',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, designation } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };
    if (designation && user.role !== 'citizen') user.designation = designation;

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        designation: updatedUser.designation,
        phone: updatedUser.phone,
        address: updatedUser.address,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of officers by department (for routing / assignment)
// @route   GET /api/auth/officers
// @access  Private (Admin / Officer)
const getOfficers = async (req, res, next) => {
  try {
    const { department } = req.query;
    const filter = { role: 'officer', isActive: true };

    if (department && department !== 'All') {
      filter.department = department;
    }

    const officers = await User.find(filter).select('name email role department designation employeeId availabilityStatus');

    res.json({
      success: true,
      count: officers.length,
      officers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register: registerCitizen,
  registerCitizen,
  registerOfficer,
  registerAdmin,
  login,
  getMe,
  updateProfile,
  getOfficers,
};
