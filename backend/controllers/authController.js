const admin = require('../config/firebase');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/google-login
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'BadRequest', message: 'ID Token is required' });
    }

    let decodedFirebaseToken;

    // Check if DEVELOPMENT_MODE is active and Firebase is not fully configured to allow a mock developer log-in
    const isFirebaseConfigured = admin.apps.length > 0;
    if (process.env.DEVELOPMENT_MODE === 'true' && !isFirebaseConfigured) {
      console.warn("DEVELOPMENT_MODE is active and Firebase Admin is not configured. Simulating developer authentication.");
      try {
        // If developer sends a JSON token payload
        const mockData = JSON.parse(idToken);
        decodedFirebaseToken = {
          name: mockData.name || 'Local Dev',
          email: mockData.email || 'dev@clientscout.app',
          picture: mockData.picture || ''
        };
      } catch (e) {
        decodedFirebaseToken = {
          name: 'Local Dev',
          email: idToken.includes('@') ? idToken : 'dev@clientscout.app',
          picture: ''
        };
      }
    } else {
      if (!isFirebaseConfigured) {
        return res.status(500).json({ 
          error: 'FirebaseNotInitialized', 
          message: 'Firebase Admin SDK has not been initialized. Please configure backend credentials in .env.' 
        });
      }
      decodedFirebaseToken = await admin.auth().verifyIdToken(idToken);
    }

    const { name, email, picture } = decodedFirebaseToken;

    if (!email) {
      return res.status(400).json({ error: 'BadRequest', message: 'Email field is missing from token payload' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        // Auto-approve first user as Admin with full rights
        user = new User({
          name: name || 'Admin',
          email: email.toLowerCase(),
          picture: picture || '',
          role: 'Admin',
          isApproved: true,
          canScan: true,
          canEditLeads: true,
          canDeleteLeads: true,
          canExport: true,
          dailyScanLimit: 100
        });
      } else {
        // Subsequent users require manual approval
        user = new User({
          name: name || 'Scout User',
          email: email.toLowerCase(),
          picture: picture || '',
          role: 'User',
          isApproved: false,
          canScan: false,
          canEditLeads: false,
          canDeleteLeads: false,
          canExport: false,
          dailyScanLimit: 5
        });
      }
      await user.save();
    } else {
      // Sync names/profile photos if updated in Google profile
      let modified = false;
      if (name && user.name !== name) { user.name = name; modified = true; }
      if (picture && user.picture !== picture) { user.picture = picture; modified = true; }
      if (modified) {
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'clientscout_secret_signing_key_2026',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        isApproved: user.isApproved,
        permissions: {
          canScan: user.canScan,
          canEditLeads: user.canEditLeads,
          canDeleteLeads: user.canDeleteLeads,
          canExport: user.canExport
        },
        dailyScansUsed: user.dailyScansUsed,
        dailyScanLimit: user.dailyScanLimit,
        lastScanResetAt: user.lastScanResetAt
      }
    });
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    return res.status(401).json({ error: 'Unauthorized', message: 'Token verification failed: ' + error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated' });
  }
  
  return res.status(200).json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    picture: req.user.picture,
    role: req.user.role,
    isApproved: req.user.isApproved,
    permissions: {
      canScan: req.user.canScan,
      canEditLeads: req.user.canEditLeads,
      canDeleteLeads: req.user.canDeleteLeads,
      canExport: req.user.canExport
    },
    dailyScansUsed: req.user.dailyScansUsed,
    dailyScanLimit: req.user.dailyScanLimit,
    lastScanResetAt: req.user.lastScanResetAt
  });
};

// GET /api/auth/users (Admin Only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'ServerError', message: 'Could not fetch user list' });
  }
};

// PUT /api/auth/users/:id (Admin Only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      role, 
      isApproved, 
      canScan, 
      canEditLeads, 
      canDeleteLeads, 
      canExport, 
      dailyScanLimit 
    } = req.body;

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ error: 'NotFound', message: 'User not found' });
    }

    // Prevention of Lockout: Admin cannot change their own role or revoke their approval
    if (req.user._id.toString() === id) {
      if (role && role !== 'Admin') {
        return res.status(400).json({ error: 'Forbidden', message: 'You cannot revoke your own Admin status.' });
      }
      if (isApproved === false) {
        return res.status(400).json({ error: 'Forbidden', message: 'You cannot un-approve your own account.' });
      }
    }

    if (role !== undefined) userToUpdate.role = role;
    if (isApproved !== undefined) userToUpdate.isApproved = isApproved;
    if (canScan !== undefined) userToUpdate.canScan = canScan;
    if (canEditLeads !== undefined) userToUpdate.canEditLeads = canEditLeads;
    if (canDeleteLeads !== undefined) userToUpdate.canDeleteLeads = canDeleteLeads;
    if (canExport !== undefined) userToUpdate.canExport = canExport;
    if (dailyScanLimit !== undefined) userToUpdate.dailyScanLimit = Number(dailyScanLimit);

    await userToUpdate.save();
    return res.status(200).json(userToUpdate);
  } catch (error) {
    console.error('Error updating user permissions:', error);
    return res.status(500).json({ error: 'ServerError', message: 'Could not update user privileges' });
  }
};

module.exports = {
  googleLogin,
  getMe,
  getUsers,
  updateUser
};
