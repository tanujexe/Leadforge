const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Malformed authorization header' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clientscout_secret_signing_key_2026');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User session invalid or user deleted' });
    }

    // Auto-reset daily scans if 24 hours have passed
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (now - new Date(user.lastScanResetAt) >= oneDayMs) {
      user.dailyScansUsed = 0;
      user.lastScanResetAt = now;
      await user.save();
    }

    // Check approval status (Admins are always approved)
    if (user.role !== 'Admin' && !user.isApproved) {
      return res.status(403).json({ 
        error: 'PendingApproval', 
        message: 'Your account is pending administrator approval.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired session token' });
    }
    return res.status(500).json({ error: 'InternalServerError', message: 'An error occurred during authentication' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Administrator access required' });
  }
  next();
};

const checkPermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }
    // Admins bypass all permission checks
    if (req.user.role === 'Admin') {
      return next();
    }
    // Check if the user has the specific permission
    if (!req.user[permissionName]) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `You do not have permission to perform this action (${permissionName.replace('can', '')})` 
      });
    }
    next();
  };
};

module.exports = {
  requireAuth,
  requireAdmin,
  checkPermission
};
