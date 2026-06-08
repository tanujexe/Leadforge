const express = require('express');
const router = express.Router();
const { exportLeadsToExcel } = require('../controllers/exportController');
const { requireAuth, checkPermission } = require('../middleware/auth');

// Base path: /api/export
router.route('/excel')
  .get(requireAuth, checkPermission('canExport'), exportLeadsToExcel);

module.exports = router;

