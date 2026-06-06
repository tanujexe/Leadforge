const express = require('express');
const router = express.Router();
const { exportLeadsToExcel } = require('../controllers/exportController');

// Base path: /api/export
router.route('/excel')
  .get(exportLeadsToExcel);

module.exports = router;
