const express = require('express');
const router = express.Router();
const { 
  getAnalytics, 
  getProductivity, 
  getGlobalTimeline, 
  getFollowUpSchedule 
} = require('../controllers/managementController');
const { requireAuth } = require('../middleware/auth');

// CRM routes require authenticated and approved users
router.get('/analytics', requireAuth, getAnalytics);
router.get('/productivity', requireAuth, getProductivity);
router.get('/timeline', requireAuth, getGlobalTimeline);
router.get('/schedule', requireAuth, getFollowUpSchedule);

module.exports = router;
