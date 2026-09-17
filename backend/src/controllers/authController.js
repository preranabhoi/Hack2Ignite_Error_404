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
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    console.log('Registration request body:', req.body);
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

    // Citizens register publicly. Officers/Admins are created by Admin or Seed.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'citizen',
      department: 'None',
      phone: typeof phone === 'string' ? phone.trim() : '',
      address: userAddress,
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
        message: 'Invalid email or password credentials',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently disabled. Please contact administrator.',
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
        designation: user.designation,
        phone: user.phone,
        address: user.address,
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
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        phone: user.phone,
        address: user.address,
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
  register,
  login,
  getMe,
  updateProfile,
  getOfficers,
};
