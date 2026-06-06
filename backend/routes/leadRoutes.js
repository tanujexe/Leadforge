const express = require('express');
const router = express.Router();
const {
  getAllLeads,
  getLeadById,
  updateLeadStatus,
  addLeadNote,
  deleteLead,
  manuallyAuditLeadWebsite,
  manuallyRegenerateAI,
  manuallyGenerateAI,
  bulkUpdateStatus,
  bulkAddNote,
  bulkDeleteLeads
} = require('../controllers/leadController');
const {
  validate,
  statusUpdateSchema,
  noteSchema,
  bulkStatusSchema,
  bulkNoteSchema,
  bulkDeleteSchema,
  idParamSchema
} = require('../middleware/validate');

// Base path: /api/leads

// 1. Directory queries
router.route('/')
  .get(getAllLeads);

// 2. Bulk Actions (Zod validated)
router.post('/bulk-status', validate(bulkStatusSchema), bulkUpdateStatus);
router.post('/bulk-note', validate(bulkNoteSchema), bulkAddNote);
router.post('/bulk-delete', validate(bulkDeleteSchema), bulkDeleteLeads);

// 3. Lead Profile Operations (Zod parameter check)
router.route('/:id')
  .get(validate(idParamSchema), getLeadById)
  .delete(validate(idParamSchema), deleteLead);

// 4. Status update and Note timeline mutations (Zod body check)
router.put('/:id/status', validate(statusUpdateSchema), updateLeadStatus);
router.post('/:id/notes', validate(noteSchema), addLeadNote);

// 5. Manual triggers (Zod param validation)
router.post('/:id/audit', validate(idParamSchema), manuallyAuditLeadWebsite);
router.post('/:id/generate-ai', validate(idParamSchema), manuallyGenerateAI);
router.post('/:id/regenerate-ai', validate(idParamSchema), manuallyRegenerateAI);

module.exports = router;
