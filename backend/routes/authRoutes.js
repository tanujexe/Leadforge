const express = require('express');
const router = express.Router();
const { googleLogin, getMe, getUsers, updateUser } = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public route: Google Auth Exchange
router.post('/google-login', googleLogin);

// Protected routes: Client Session
router.get('/me', requireAuth, getMe);

// Team Member Management (Read allowed for all team members, Update restricted to Admin)
router.get('/users', requireAuth, getUsers);
router.put('/users/:id', requireAuth, requireAdmin, updateUser);

module.exports = router;
