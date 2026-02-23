const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agency = require('../models/Agency');

const generateToken = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    
    const user = await User.create({ name, email, password });
    const token = generateToken({ id: user._id, role: user.role });
    res.cookie('token', token, cookieOptions);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Register error:', err);
    // Provide more detailed error messages
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: err.message || 'Server error', error: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.isSuspended) return res.status(403).json({ message: 'Account suspended' });
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    
    const token = generateToken({ id: user._id, role: user.role });
    res.cookie('token', token, cookieOptions);
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Server error', error: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
};

exports.agencyRegister = async (req, res) => {
  try {
    const { businessName, email, password, commissionTier } = req.body;
    const existing = await Agency.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const agency = await Agency.create({ businessName, email, password, commissionTier });
    const token = generateToken({ id: agency._id, role: 'AGENCY' });
    res.cookie('token', token, cookieOptions);
    res.status(201).json({ agency: { id: agency._id, businessName: agency.businessName, email: agency.email, verificationStatus: agency.verificationStatus } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.agencyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const agency = await Agency.findOne({ email });
    if (!agency) return res.status(401).json({ message: 'Invalid credentials' });
    if (agency.isSuspended) return res.status(403).json({ message: 'Account suspended' });
    const isMatch = await agency.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const token = generateToken({ id: agency._id, role: 'AGENCY' });
    res.cookie('token', token, cookieOptions);
    res.json({ agency: { id: agency._id, businessName: agency.businessName, email: agency.email, verificationStatus: agency.verificationStatus } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

exports.me = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ user: null });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, role } = decoded;

    if (role === 'AGENCY') {
      const agency = await Agency.findById(id).select('-password');
      if (!agency || agency.isSuspended) {
        res.clearCookie('token');
        return res.json({ user: null });
      }

      return res.json({
        user: {
          id: String(agency._id),
          name: agency.businessName,
          businessName: agency.businessName,
          email: agency.email,
          role: 'AGENCY'
        }
      });
    }

    const user = await User.findById(id).select('-password');
    if (!user || user.isSuspended) {
      res.clearCookie('token');
      return res.json({ user: null });
    }

    return res.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.clearCookie('token');
    return res.json({ user: null });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    if (req.user.role === 'AGENCY') {
      const agency = await Agency.findById(req.user.id);
      if (!agency) return res.status(404).json({ message: 'Agency not found' });

      if (email !== agency.email) {
        const existing = await Agency.findOne({ email });
        if (existing) return res.status(409).json({ message: 'Email already registered' });
        agency.email = email;
      }

      agency.businessName = name;
      await agency.save();

      return res.json({
        user: {
          id: String(agency._id),
          name: agency.businessName,
          businessName: agency.businessName,
          email: agency.email,
          role: 'AGENCY',
          verificationStatus: agency.verificationStatus,
          commissionTier: agency.commissionTier,
          createdAt: agency.createdAt
        }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ message: 'Email already registered' });
      user.email = email;
    }

    user.name = name;
    await user.save();

    res.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Old password, new password, and confirm password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    // Support both USER and AGENCY
    const Model = req.user.role === 'AGENCY' ? Agency : User;
    const account = await Model.findById(req.user.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const isMatch = await account.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    account.password = newPassword;
    await account.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
