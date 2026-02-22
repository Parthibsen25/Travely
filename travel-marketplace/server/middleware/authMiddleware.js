const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agency = require('../models/Agency');

exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Try to load user or agency
    const { id, role } = decoded;
    if (role === 'AGENCY') {
      const agency = await Agency.findById(id).select('-password');
      if (!agency) return res.status(401).json({ message: 'Not authorized' });
      if (agency.isSuspended) return res.status(403).json({ message: 'Account suspended' });
      req.user = {
        id: String(agency._id),
        role: 'AGENCY',
        email: agency.email,
        businessName: agency.businessName
      };
    } else {
      const user = await User.findById(id).select('-password');
      if (!user) return res.status(401).json({ message: 'Not authorized' });
      if (user.isSuspended) return res.status(403).json({ message: 'Account suspended' });
      req.user = {
        id: String(user._id),
        role: user.role,
        email: user.email,
        name: user.name
      };
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Not authorized' });
  }
};
