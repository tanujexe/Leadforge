const express = require('express');
const router = express.Router();
const {
  createSearch,
  getSearchQueryStatus,
  getRecentSearches
} = require('../controllers/searchController');
const { validate, searchSchema, idParamSchema } = require('../middleware/validate');
const { requireAuth, checkPermission } = require('../middleware/auth');

// Base path: /api/search

// Validate search inputs on scan dispatcher and enforce scan authorization/permissions
router.route('/')
  .post(requireAuth, checkPermission('canScan'), validate(searchSchema), createSearch);

router.route('/history')
  .get(requireAuth, getRecentSearches);

// Validate MongoDB ObjectId on status check polling
router.route('/status/:id')
  .get(requireAuth, validate(idParamSchema), getSearchQueryStatus);

module.exports = router;

