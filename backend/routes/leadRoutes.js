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
  bulkDeleteLeads,
  getTrashLeads,
  restoreLead,
  purgeLead,
  bulkRestoreLeads,
  bulkPurgeLeads,
  getLeadActivity,
  logCall,
  assignLead,
  updateActivityLog,
  deleteActivityLog
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
const { requireAuth, requireAdmin, checkPermission } = require('../middleware/auth');

// Base path: /api/leads

// 1. Directory queries (Requires Auth)
router.route('/')
  .get(requireAuth, getAllLeads);

// 2. Trash Recovery Routes (Admin Only)
router.route('/trash')
  .get(requireAuth, requireAdmin, getTrashLeads);

router.post('/trash/bulk-restore', requireAuth, requireAdmin, bulkRestoreLeads);
router.post('/trash/bulk-purge', requireAuth, requireAdmin, bulkPurgeLeads);

router.route('/trash/:id/restore')
  .post(requireAuth, requireAdmin, validate(idParamSchema), restoreLead);

router.route('/trash/:id/purge')
  .delete(requireAuth, requireAdmin, validate(idParamSchema), purgeLead);

// 3. Bulk Actions (Requires Auth and appropriate permissions)
router.post('/bulk-status', requireAuth, checkPermission('canEditLeads'), validate(bulkStatusSchema), bulkUpdateStatus);
router.post('/bulk-note', requireAuth, checkPermission('canEditLeads'), validate(bulkNoteSchema), bulkAddNote);
router.post('/bulk-delete', requireAuth, checkPermission('canDeleteLeads'), validate(bulkDeleteSchema), bulkDeleteLeads);

// 4. Lead Profile Operations (Requires Auth)
router.route('/:id')
  .get(requireAuth, validate(idParamSchema), getLeadById)
  .delete(requireAuth, checkPermission('canDeleteLeads'), validate(idParamSchema), deleteLead);

// 5. Status update and Note timeline mutations (Requires canEditLeads permission)
router.put('/:id/status', requireAuth, checkPermission('canEditLeads'), validate(statusUpdateSchema), updateLeadStatus);
router.post('/:id/notes', requireAuth, checkPermission('canEditLeads'), validate(noteSchema), addLeadNote);

// 6. Manual triggers (Requires canScan permission)
router.post('/:id/audit', requireAuth, checkPermission('canScan'), validate(idParamSchema), manuallyAuditLeadWebsite);
router.post('/:id/generate-ai', requireAuth, checkPermission('canScan'), validate(idParamSchema), manuallyGenerateAI);
router.post('/:id/regenerate-ai', requireAuth, checkPermission('canScan'), validate(idParamSchema), manuallyRegenerateAI);

// 7. CRM & Activity Routes (Requires Auth)
router.get('/:id/activity', requireAuth, validate(idParamSchema), getLeadActivity);
router.post('/:id/call', requireAuth, checkPermission('canEditLeads'), validate(idParamSchema), logCall);
router.post('/:id/assign', requireAuth, checkPermission('canEditLeads'), validate(idParamSchema), assignLead);
router.put('/:id/activity/:logId', requireAuth, checkPermission('canEditLeads'), validate(idParamSchema), updateActivityLog);
router.delete('/:id/activity/:logId', requireAuth, checkPermission('canEditLeads'), validate(idParamSchema), deleteActivityLog);

module.exports = router;

