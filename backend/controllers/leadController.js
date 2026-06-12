const Lead = require('../models/Lead');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { auditWebsite } = require('../services/audit/auditService');
const { analyzeLeadAndGeneratePitches } = require('../services/groq/groqService');
const { calculateLeadScore } = require('../utils/leadScorer');

// Helper to log user activities permanently
const logActivity = async (leadId, userId, actionType, details, callOutcome = null, followUpDate = null, noteId = null) => {
  try {
    const newLog = new ActivityLog({
      leadId,
      userId,
      actionType,
      details,
      callOutcome,
      followUpDate,
      noteId
    });
    await newLog.save();
  } catch (err) {
    console.error('❌ Failed to save ActivityLog record:', err.message);
  }
};

// Helper to enforce lead record ownership
const checkLeadEditPermission = async (lead, user) => {
  if (!user) {
    const error = new Error('Authentication required.');
    error.statusCode = 401;
    throw error;
  }
  
  if (!lead.owner) {
    // Lazy assign the first modifier as the owner
    lead.owner = user._id;
    if (!lead.assignedTo) {
      lead.assignedTo = user._id;
    }
    await lead.save();
    
    // Log the initial ownership claim
    await logActivity(
      lead._id,
      user._id,
      'Assign',
      `Ownership claimed and assigned to ${user.name} during first edit.`
    );
  } else if (lead.owner.toString() !== user._id.toString() && user.role !== 'Admin') {
    const error = new Error('You do not own this lead record and cannot modify it.');
    error.statusCode = 403;
    throw error;
  }
};

/**
 * Get all leads with server-side pagination, sorting, and filters
 * Performance optimization: Project list fields only (exclude large AI pitches and notes)
 */
const getAllLeads = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const { search, hasWebsite, opportunityLevel, status, websiteStatus, category, city, quickFilter, searchQueryId, hasCustomPitch } = req.query;
    
    // Build query object (filter out soft-deleted leads)
    let query = { isDeleted: { $ne: true } };

    // 1. Partial substring search using regex across key fields
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { businessName: { $regex: searchRegex } },
        { phone: { $regex: searchRegex } },
        { address: { $regex: searchRegex } },
        { category: { $regex: searchRegex } }
      ];
    }

    // 2. Filter: Category (Niche)
    if (category) {
      const categoryRegexMap = {
        'Gym': /gym|fitness|health|trainer/i,
        'Cafe': /cafe|coffee|bakery|coffe/i,
        'Salon': /salon|spa|beauty|hair|parlour/i,
        'Dentist': /dentist|dental|dent|orthodont/i,
        'Real Estate': /real estate|property|estate|realtor/i,
        'Restaurant': /restaurant|eatery|dining|food|kitchen|bites|grill/i,
        'Interior Designer': /interior|designer|design/i,
        'Plumber': /plumber|plumbing|pipe|piping/i,
        'Electrician': /electrician|electrical|power/i,
        'Spa': /spa|wellness|massage/i,
        'Boutique': /boutique|fashion|clothing|apparel/i,
        'Bakery': /bakery|bakehouse|sweets|cake/i,
        'Hotel': /hotel|resort|lodging|inn/i,
        'Car Service': /car|auto|repair|service|garage/i,
        'Lawyer': /lawyer|attorney|law/i
      };

      if (categoryRegexMap[category]) {
        query.category = { $regex: categoryRegexMap[category] };
      } else {
        query.category = { $regex: new RegExp(category.trim(), 'i') };
      }
    }

    // 3. Filter: City (Location)
    if (city) {
      query.address = { $regex: new RegExp(city.trim(), 'i') };
    }

    // 4. Filter: Outreach Status
    if (status) {
      query.status = status;
    }

    // 9. Filter: Search Query Link (Particular search job filter)
    if (searchQueryId) {
      query.searchQueryId = searchQueryId;
    }

    // Establish statsQuery (filters applied to stats cards calculation)
    const statsQuery = { ...query };

    // Apply specific parameters to the main paginated query
    // 5. Filter: Has Website
    if (hasWebsite) {
      if (hasWebsite === 'true') {
        query.website = { $exists: true, $nin: [null, '', 'null'] };
      } else {
        query.website = { $in: [null, '', 'null'] };
      }
    }

    // 6. Filter: Opportunity Level
    if (opportunityLevel) {
      query.opportunityLevel = opportunityLevel;
    }

    // 7. Filter: Website Status
    if (websiteStatus) {
      query.websiteStatus = websiteStatus;
    }

    // Filter: Has Custom Pitch
    if (hasCustomPitch) {
      if (hasCustomPitch === 'true') {
        query.customPitch = { $exists: true, $nin: [null, '', 'null'] };
      } else {
        query.customPitch = { $in: [null, '', 'null'] };
      }
    }

    // 8. Filter: Quick Filter matching stats card categories
    if (quickFilter) {
      if (quickFilter === 'hot') {
        query.opportunityLevel = 'High';
      } else if (quickFilter === 'warm') {
        query.opportunityLevel = 'Medium';
      } else if (quickFilter === 'cold') {
        query.opportunityLevel = 'Low';
      } else if (quickFilter === 'needWebsite') {
        query.$or = [
          { website: { $exists: false } },
          { website: null },
          { website: '' },
          { website: 'null' },
          { websiteStatus: 'No Website' }
        ];
      } else if (quickFilter === 'needReputation') {
        query.$or = [
          { rating: { $lt: 4.0 } },
          { reviewCount: { $lt: 15 } }
        ];
      } else if (quickFilter === 'needSocial') {
        query.$or = [
          { website: { $exists: false } },
          { website: null },
          { website: '' },
          { website: 'null' },
          { websiteStatus: 'No Website' },
          { opportunityLevel: 'High' }
        ];
      } else if (quickFilter === 'enriched') {
        query.phone = { $exists: true, $ne: '' };
        query.website = { $exists: true, $nin: [null, '', 'null'] };
      }
    }

    // Project listing fields ONLY to optimize database memory and network payloads
    const projection = {
      businessName: 1,
      phone: 1,
      website: 1,
      address: 1,
      googleMapsUrl: 1,
      rating: 1,
      reviewCount: 1,
      category: 1,
      websiteScore: 1,
      websiteStatus: 1,
      leadScore: 1,
      opportunityLevel: 1,
      status: 1,
      createdAt: 1,
      owner: 1,
      assignedTo: 1,
      followUpDate: 1,
      totalCalls: 1,
      customPitch: 1
    };

    const totalLeads = await Lead.countDocuments(query);
    const leads = await Lead.find(query, projection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name email picture')
      .populate('assignedTo', 'name email picture');

    // Compute stats counts database-wide for the current base query
    const stats = {
      hot: await Lead.countDocuments({ ...statsQuery, opportunityLevel: 'High' }),
      warm: await Lead.countDocuments({ ...statsQuery, opportunityLevel: 'Medium' }),
      cold: await Lead.countDocuments({ ...statsQuery, opportunityLevel: 'Low' }),
      needWebsite: await Lead.countDocuments({
        ...statsQuery,
        $or: [
          { website: { $exists: false } },
          { website: null },
          { website: '' },
          { website: 'null' },
          { websiteStatus: 'No Website' }
        ]
      }),
      needReputation: await Lead.countDocuments({
        ...statsQuery,
        $or: [
          { rating: { $lt: 4.0 } },
          { reviewCount: { $lt: 15 } }
        ]
      }),
      needSocial: await Lead.countDocuments({
        ...statsQuery,
        $or: [
          { website: { $exists: false } },
          { website: null },
          { website: '' },
          { website: 'null' },
          { websiteStatus: 'No Website' },
          { opportunityLevel: 'High' }
        ]
      }),
      enriched: await Lead.countDocuments({
        ...statsQuery,
        phone: { $exists: true, $ne: '' },
        website: { $exists: true, $nin: [null, '', 'null'] }
      }),
      statusCounts: {
        new: await Lead.countDocuments({ ...statsQuery, status: 'New' }),
        contacted: await Lead.countDocuments({ ...statsQuery, status: 'Contacted' }),
        followUp: await Lead.countDocuments({ ...statsQuery, status: 'Follow Up' }),
        interested: await Lead.countDocuments({ ...statsQuery, status: 'Interested' }),
        closed: await Lead.countDocuments({ ...statsQuery, status: 'Closed' }),
        rejected: await Lead.countDocuments({ ...statsQuery, status: 'Rejected' })
      }
    };

    res.status(200).json({
      success: true,
      page,
      limit,
      totalLeads,
      totalPages: Math.ceil(totalLeads / limit),
      data: leads,
      stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single lead - Full dossier (Includes screenshot paths, notes list, and AI pitches)
 */
const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('owner', 'name email picture role')
      .populate('assignedTo', 'name email picture role');
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }
    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update outreach status
 */
const updateLeadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400);
      throw new Error('Please provide a status value');
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    const oldStatus = lead.status;
    await checkLeadEditPermission(lead, req.user);
    lead.status = status;
    await lead.save();

    // Log activity
    await logActivity(
      lead._id,
      req.user._id,
      'StatusChange',
      `Status updated from ${oldStatus} to ${status}.`
    );

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Update user custom outreach pitch
 */
const updateLeadPitch = async (req, res, next) => {
  try {
    const { customPitch } = req.body;
    if (customPitch === undefined) {
      res.status(400);
      throw new Error('Please provide customPitch value');
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    await checkLeadEditPermission(lead, req.user);
    lead.customPitch = customPitch;
    await lead.save();

    // Log activity
    await logActivity(
      lead._id,
      req.user._id,
      'AddNote',
      `Custom outreach pitch updated.`
    );

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Log a timestamped note
 */
const addLeadNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || content.trim() === '') {
      res.status(400);
      throw new Error('Note content cannot be empty');
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    await checkLeadEditPermission(lead, req.user);
    lead.notes.unshift({ content: content.trim() });
    await lead.save();

    const newNote = lead.notes[0];

    // Log activity
    await logActivity(
      lead._id,
      req.user._id,
      'AddNote',
      `Note logged: "${content.trim().slice(0, 60)}${content.trim().length > 60 ? '...' : ''}"`,
      null,
      null,
      newNote._id
    );

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Destroy lead row
 */
const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    await checkLeadEditPermission(lead, req.user);
    lead.isDeleted = true;
    await lead.save();

    // Log activity
    await logActivity(
      lead._id,
      req.user._id,
      'StatusChange',
      'Lead moved to Trash Recovery.'
    );
    
    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Manually trigger website audit refresh (uses 7-day cache by default)
 */
const manuallyAuditLeadWebsite = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    await checkLeadEditPermission(lead, req.user);

    if (!lead.website) {
      res.status(400);
      throw new Error('Lead does not have a website URL to audit');
    }

    // Check if we should reuse cached audit (within 7 days)
    const force = req.query.force === 'true';
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    if (!force && lead.lastAuditAt && lead.lastAuditAt >= sevenDaysAgo && lead.audit) {
      console.log(`[Manual Audit] Reusing cached audit for: "${lead.businessName}" (Last audited at: ${lead.lastAuditAt})`);
      return res.status(200).json({
        success: true,
        message: 'Reused cached audit results (within 7 days).',
        data: lead
      });
    }

    console.log(`[Manual Audit] Re-running website crawler for: "${lead.businessName}"`);
    const auditResult = await auditWebsite(lead.website, lead._id);

    lead.audit = auditResult;
    lead.websiteScore = auditResult.websiteScore;
    lead.websiteStatus = auditResult.websiteStatus;
    lead.screenshotFull = auditResult.screenshotFull || lead.screenshotFull;
    lead.screenshotThumb = auditResult.screenshotThumb || lead.screenshotThumb;
    lead.lastAuditAt = new Date();

    // Recalculate scores based on updated audit
    const scoreResult = calculateLeadScore(lead);
    lead.leadScore = scoreResult.leadScore;
    lead.opportunityLevel = scoreResult.opportunityLevel;
    lead.recommendedService = scoreResult.recommendedService;

    await lead.save();

    // Log activity
    await logActivity(
      lead._id,
      req.user._id,
      'Audited',
      `Manual website audit executed (Cache bypassed: ${force ? 'Yes' : 'No'}).`
    );

    res.status(200).json({
      success: true,
      message: 'Website audit refreshed successfully.',
      data: lead
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Manually trigger Groq AI pitch generation (cached)
 */
const manuallyGenerateAI = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    await checkLeadEditPermission(lead, req.user);

    // Reuse existing AI cache if present
    if (lead.aiSummary && lead.aiSummary.trim() !== '') {
      console.log(`[Manual AI] Reusing cached AI analysis for: "${lead.businessName}"`);
      return res.status(200).json({
        success: true,
        message: 'Reused existing AI analysis.',
        data: lead
      });
    }

    console.log(`[Manual AI] Generating pitches and summary via Groq for: "${lead.businessName}"`);
    const aiResults = await analyzeLeadAndGeneratePitches(lead);

    lead.aiSummary = aiResults.aiSummary;
    lead.aiReason = aiResults.aiReason;
    lead.callPitch = aiResults.callPitch;
    lead.whatsappPitch = aiResults.whatsappPitch;
    lead.emailPitch = aiResults.emailPitch;
    lead.meetingPitch = aiResults.meetingPitch;

    await lead.save();

    // Log activity
    await logActivity(
      lead._id,
      req.user._id,
      'AIRegenerated',
      'Outreach proposals generated using Groq AI.'
    );

    res.status(200).json({
      success: true,
      message: 'AI pitches generated successfully.',
      data: lead
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Manually trigger Groq AI pitch refresh (force regenerate)
 */
const manuallyRegenerateAI = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    await checkLeadEditPermission(lead, req.user);

    console.log(`[Manual AI] Force regenerating pitches and summary via Groq for: "${lead.businessName}"`);
    const aiResults = await analyzeLeadAndGeneratePitches(lead);

    lead.aiSummary = aiResults.aiSummary;
    lead.aiReason = aiResults.aiReason;
    lead.callPitch = aiResults.callPitch;
    lead.whatsappPitch = aiResults.whatsappPitch;
    lead.emailPitch = aiResults.emailPitch;
    lead.meetingPitch = aiResults.meetingPitch;

    await lead.save();

    // Log activity
    await logActivity(
      lead._id,
      req.user._id,
      'AIRegenerated',
      'Outreach proposals regenerated and refreshed using Groq AI.'
    );

    res.status(200).json({
      success: true,
      message: 'AI pitches regenerated successfully.',
      data: lead
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Bulk Update outreach statuses
 */
const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || !status) {
      res.status(400);
      throw new Error('Please provide an array of lead IDs and a status value');
    }

    const result = await Lead.updateMany(
      { _id: { $in: ids } },
      { $set: { status: status } }
    );

    res.status(200).json({
      success: true,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Append notes
 */
const bulkAddNote = async (req, res, next) => {
  try {
    const { ids, content } = req.body;
    if (!ids || !Array.isArray(ids) || !content || content.trim() === '') {
      res.status(400);
      throw new Error('Please provide an array of lead IDs and non-empty note content');
    }

    // Append notes log to timeline arrays
    const result = await Lead.updateMany(
      { _id: { $in: ids } },
      { 
        $push: { 
          notes: { 
            $each: [{ content }], 
            $position: 0 
          } 
        } 
      }
    );

    res.status(200).json({
      success: true,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Delete leads
 */
const bulkDeleteLeads = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      res.status(400);
      throw new Error('Please provide an array of lead IDs to delete');
    }

    const result = await Lead.updateMany(
      { _id: { $in: ids } },
      { $set: { isDeleted: true } }
    );

    res.status(200).json({
      success: true,
      deletedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all soft-deleted leads (Trash) - Admin only
 */
const getTrashLeads = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const query = { isDeleted: true };
    const totalLeads = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalLeads,
      totalPages: Math.ceil(totalLeads / limit),
      data: leads
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore a soft-deleted lead - Admin only
 */
const restoreLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: false } },
      { new: true }
    );

    if (!lead) {
      res.status(404);
      throw new Error('Lead not found or not in trash');
    }

    res.status(200).json({
      success: true,
      message: 'Lead restored successfully',
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete (purge) a lead from MongoDB - Admin only
 */
const purgeLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }

    res.status(200).json({
      success: true,
      message: 'Lead permanently purged from database'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk restore soft-deleted leads - Admin only
 */
const bulkRestoreLeads = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      res.status(400);
      throw new Error('Please provide an array of lead IDs to restore');
    }

    const result = await Lead.updateMany(
      { _id: { $in: ids }, isDeleted: true },
      { $set: { isDeleted: false } }
    );

    res.status(200).json({
      success: true,
      restoredCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk permanently delete (purge) leads - Admin only
 */
const bulkPurgeLeads = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      res.status(400);
      throw new Error('Please provide an array of lead IDs to purge');
    }

    const result = await Lead.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      purgedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get chronological activity history logs for a lead
 */
const getLeadActivity = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find({ leadId: req.params.id })
      .sort({ timestamp: -1 })
      .populate('userId', 'name email picture role');
      
    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log outreach call outcome and schedule optional follow-up
 */
const logCall = async (req, res, next) => {
  try {
    const { callOutcome, details, followUpDate } = req.body;
    if (!callOutcome) {
      res.status(400);
      throw new Error('Please provide a call outcome.');
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found.');
    }

    await checkLeadEditPermission(lead, req.user);

    // Increment call counter
    lead.totalCalls = (lead.totalCalls || 0) + 1;
    
    // Set follow-up date if scheduled
    if (followUpDate) {
      lead.followUpDate = new Date(followUpDate);
      lead.status = 'Follow Up'; // Transition pipeline status automatically
    } else {
      // Transition to Contacted status if not already follow-up/interested/closed
      if (['New'].includes(lead.status)) {
        lead.status = 'Contacted';
      }
    }
    
    await lead.save();

    // Log to permanent Activity logs
    await logActivity(
      lead._id,
      req.user._id,
      'CallLog',
      details || `Call placed. Outcome: ${callOutcome}`,
      callOutcome,
      followUpDate ? new Date(followUpDate) : null
    );

    res.status(200).json({
      success: true,
      message: 'Call logged successfully.',
      data: lead
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Assign lead handling to a team member
 */
const assignLead = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400);
      throw new Error('Please provide a user ID to assign.');
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found.');
    }

    // Only owner or admin can assign leads
    await checkLeadEditPermission(lead, req.user);

    const assignee = await User.findById(userId);
    if (!assignee) {
      res.status(404);
      throw new Error('Assignee user not found.');
    }

    const oldAssignee = lead.assignedTo ? await User.findById(lead.assignedTo) : null;
    lead.assignedTo = assignee._id;
    await lead.save();

    // Log activity
    await logActivity(
      lead._id,
      req.user._id,
      'Assign',
      `Lead assigned to ${assignee.name}${oldAssignee ? ` (previously assigned to ${oldAssignee.name})` : ''}.`
    );

    res.status(200).json({
      success: true,
      message: `Lead assigned to ${assignee.name} successfully.`,
      data: lead
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Update a manual activity log entry (Note or CallLog)
 */
const updateActivityLog = async (req, res, next) => {
  try {
    const { id, logId } = req.params;
    const { details, callOutcome, followUpDate } = req.body;

    const log = await ActivityLog.findById(logId);
    if (!log) {
      res.status(404);
      throw new Error('Activity log entry not found.');
    }

    if (log.leadId.toString() !== id) {
      res.status(400);
      throw new Error('Log entry does not belong to this lead.');
    }

    if (log.userId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      res.status(403);
      throw new Error('You do not have permission to modify this log entry.');
    }

    if (!['AddNote', 'CallLog'].includes(log.actionType)) {
      res.status(400);
      throw new Error('Only manual notes and call logs can be edited.');
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found.');
    }

    if (log.actionType === 'AddNote') {
      if (log.noteId) {
        const noteSubdoc = lead.notes.id(log.noteId);
        if (noteSubdoc && details) {
          noteSubdoc.content = details;
          await lead.save();
        }
      } else {
        const oldNoteText = log.details.replace(/^Note logged: "/, '').replace(/"$/, '').replace(/^Note added by .*?: "/, '').replace(/"$/, '');
        const noteSubdoc = lead.notes.find(n => n.content.substring(0, 60) === oldNoteText.substring(0, 60));
        if (noteSubdoc && details) {
          noteSubdoc.content = details;
          await lead.save();
        }
      }
      
      log.details = `Note logged: "${details}"`;
    } else if (log.actionType === 'CallLog') {
      if (details) log.details = details;
      if (callOutcome) log.callOutcome = callOutcome;
      
      if (followUpDate !== undefined) {
        log.followUpDate = followUpDate ? new Date(followUpDate) : null;
        
        if (followUpDate) {
          lead.followUpDate = new Date(followUpDate);
          lead.status = 'Follow Up';
        } else {
          const now = new Date();
          const remainingFollowups = await ActivityLog.find({
            leadId: lead._id,
            _id: { $ne: log._id },
            actionType: 'CallLog',
            followUpDate: { $ne: null, $gte: now }
          }).sort({ followUpDate: 1 });
          
          if (remainingFollowups.length > 0) {
            lead.followUpDate = remainingFollowups[0].followUpDate;
          } else {
            lead.followUpDate = null;
            if (lead.status === 'Follow Up') {
              lead.status = 'Contacted';
            }
          }
        }
        await lead.save();
      }
    }

    await log.save();

    res.status(200).json({
      success: true,
      message: 'Activity log updated successfully.',
      data: log
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

/**
 * Delete a manual activity log entry
 */
const deleteActivityLog = async (req, res, next) => {
  try {
    const { id, logId } = req.params;

    const log = await ActivityLog.findById(logId);
    if (!log) {
      res.status(404);
      throw new Error('Activity log entry not found.');
    }

    if (log.leadId.toString() !== id) {
      res.status(400);
      throw new Error('Log entry does not belong to this lead.');
    }

    if (log.userId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      res.status(403);
      throw new Error('You do not have permission to delete this log entry.');
    }

    if (!['AddNote', 'CallLog'].includes(log.actionType)) {
      res.status(400);
      throw new Error('Only manual notes and call logs can be deleted.');
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found.');
    }

    if (log.actionType === 'AddNote') {
      if (log.noteId) {
        lead.notes.pull(log.noteId);
        await lead.save();
      } else {
        const oldNoteText = log.details.replace(/^Note logged: "/, '').replace(/"$/, '').replace(/^Note added by .*?: "/, '').replace(/"$/, '');
        const noteIndex = lead.notes.findIndex(n => n.content.substring(0, 60) === oldNoteText.substring(0, 60));
        if (noteIndex > -1) {
          lead.notes.splice(noteIndex, 1);
          await lead.save();
        }
      }
    } else if (log.actionType === 'CallLog') {
      lead.totalCalls = Math.max(0, (lead.totalCalls || 1) - 1);

      const now = new Date();
      const remainingFollowups = await ActivityLog.find({
        leadId: lead._id,
        _id: { $ne: log._id },
        actionType: 'CallLog',
        followUpDate: { $ne: null, $gte: now }
      }).sort({ followUpDate: 1 });

      if (remainingFollowups.length > 0) {
        lead.followUpDate = remainingFollowups[0].followUpDate;
      } else {
        lead.followUpDate = null;
        if (lead.status === 'Follow Up') {
          lead.status = 'Contacted';
        }
      }
      await lead.save();
    }

    await ActivityLog.findByIdAndDelete(logId);

    res.status(200).json({
      success: true,
      message: 'Activity log deleted successfully.'
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

module.exports = {
  getAllLeads,
  getLeadById,
  updateLeadStatus,
  updateLeadPitch,
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
};

