const jwt = require('jsonwebtoken');
const User = require('../models/User');

const CONTROLLED_DEPARTMENTS = [
  'Public Works & Roads',
  'Water Supply & Sanitation',
  'Electricity & Power',
  'Waste Management',
  'Drainage & Sewerage',
  'Street Lighting',
  'Public Safety',
  'Environment',
];

const isValidEmail = (email) => {
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/.test(email);
};

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
// @route   POST /api/auth/register (and POST /api/auth/register/citizen)
// @access  Public
const registerCitizen = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone, ward, city, address } = req.body;

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
        message: 'Please provide name, email, and password (minimum 8 characters).',
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered.',
      });
    }

    const userAddress = {
      city: typeof city === 'string' ? city.trim() : (address?.city || ''),
      ward: typeof ward === 'string' ? ward.trim() : (address?.ward || ''),
      pincode: address?.pincode || '',
    };

    // Security Invariant: Public citizen registration ALWAYS creates role: 'citizen', ignoring any client role
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'citizen',
      department: 'None',
      phone: typeof phone === 'string' ? phone.trim() : '',
      address: userAddress,
      status: 'active',
      isActive: true,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully.',
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

// @desc    Register a new Field Officer
// @route   POST /api/auth/register-officer (and POST /api/auth/register/officer)
// @access  Public
const registerOfficer = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      employeeId,
      department,
      officerType,
      designation,
      ward,
      city,
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

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const normalizedEmpId = employeeId.trim().toUpperCase();

    // Check unique email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered.',
      });
    }

    // Check unique employee ID
    const existingEmp = await User.findOne({ employeeId: normalizedEmpId });
    if (existingEmp) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is already registered.',
      });
    }

    // Validate controlled departments
    const trimmedDept = department.trim();
    if (!CONTROLLED_DEPARTMENTS.includes(trimmedDept) && trimmedDept !== 'General Administration') {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid municipal department.',
      });
    }

    // Security Invariant: Role is strictly forced to 'officer'
    const officer = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'officer',
      department: trimmedDept,
      officerType: officerType && typeof officerType === 'string' ? officerType.trim() : 'Field Officer',
      designation: designation && typeof designation === 'string' && designation.trim() ? designation.trim() : 'Field Officer',
      employeeId: normalizedEmpId,
      phone: typeof phone === 'string' ? phone.trim() : '',
      address: {
        city: typeof city === 'string' && city.trim() ? city.trim() : 'Bhubaneswar',
        ward: typeof ward === 'string' ? ward.trim() : '',
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
// @route   POST /api/auth/register-admin (and POST /api/auth/register/admin)
// @access  Public (Protected by Administrator Setup Code)
const registerAdmin = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
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

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    // 1. Verify administrator setup code configuration
    const expectedSetupCode = process.env.ADMIN_SETUP_CODE || process.env.ADMIN_REGISTRATION_CODE;
    const submittedCode = setupCode !== undefined ? setupCode : registrationCode;

    if (!expectedSetupCode || !submittedCode || typeof submittedCode !== 'string' || submittedCode.trim() !== expectedSetupCode) {
      return res.status(403).json({
        success: false,
        message: 'Invalid administrator setup code. Access denied.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // 2. Duplicate checks
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered.',
      });
    }

    const effectiveAdminId = (administratorId || adminId || employeeId || '').trim().toUpperCase();
    if (effectiveAdminId) {
      const existingId = await User.findOne({ employeeId: effectiveAdminId });
      if (existingId) {
        return res.status(400).json({
          success: false,
          message: 'Administrator ID is already registered.',
        });
      }
    }

    // 3. Create admin account - role is strictly forced to 'admin'
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

// Helper to perform authenticated login with optional role enforcement
const authenticateUser = async (req, res, next, expectedRole = null) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || email.length > 254 ||
      !password || typeof password !== 'string' || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
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

    // Role-specific check if invoked via role login endpoint
    if (expectedRole && user.role !== expectedRole) {
      const messages = {
        citizen: 'These credentials are not registered as a Citizen.',
        officer: 'These credentials are not registered as a Field Officer.',
        admin: 'These credentials are not registered as an Administrator.',
      };
      return res.status(403).json({
        success: false,
        message: messages[expectedRole] || `These credentials are not registered for this role.`,
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

// @desc    Universal Login
// @route   POST /api/auth/login
const login = (req, res, next) => authenticateUser(req, res, next, null);

// @desc    Citizen Login
// @route   POST /api/auth/login/citizen
const loginCitizen = (req, res, next) => authenticateUser(req, res, next, 'citizen');

// @desc    Field Officer Login
// @route   POST /api/auth/login/officer
const loginOfficer = (req, res, next) => authenticateUser(req, res, next, 'officer');

// @desc    Administrator Login
// @route   POST /api/auth/login/admin
const loginAdmin = (req, res, next) => authenticateUser(req, res, next, 'admin');

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
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
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address) user.address = { ...user.address, ...address };
    if (designation && user.role !== 'citizen') user.designation = designation;

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
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
  loginCitizen,
  loginOfficer,
  loginAdmin,
  getMe,
  updateProfile,
  getOfficers,
  CONTROLLED_DEPARTMENTS,
};
