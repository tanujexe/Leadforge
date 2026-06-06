const express = require('express');
const router = express.Router();
const {
  createSearch,
  getSearchQueryStatus,
  getRecentSearches
} = require('../controllers/searchController');
const { validate, searchSchema, idParamSchema } = require('../middleware/validate');

// Base path: /api/search

// Validate search inputs on scan dispatcher
router.route('/')
  .post(validate(searchSchema), createSearch);

router.route('/history')
  .get(getRecentSearches);

// Validate MongoDB ObjectId on status check polling
router.route('/status/:id')
  .get(validate(idParamSchema), getSearchQueryStatus);

module.exports = router;
