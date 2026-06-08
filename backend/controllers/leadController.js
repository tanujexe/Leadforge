const Lead = require('../models/Lead');
const { auditWebsite } = require('../services/audit/auditService');
const { analyzeLeadAndGeneratePitches } = require('../services/groq/groqService');
const { calculateLeadScore } = require('../utils/leadScorer');

/**
 * Get all leads with server-side pagination, sorting, and filters
 * Performance optimization: Project list fields only (exclude large AI pitches and notes)
 */
const getAllLeads = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const { search, hasWebsite, opportunityLevel, status, websiteStatus, category, city, quickFilter, searchQueryId } = req.query;
    
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
        query.$or = [
          { website: { $exists: false } },
          { website: null },
          { website: '' },
          { website: 'null' }
        ];
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
      createdAt: 1
    };

    const totalLeads = await Lead.countDocuments(query);
    const leads = await Lead.find(query, projection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
    const lead = await Lead.findById(req.params.id);
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

    lead.status = status;
    await lead.save();

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
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

    lead.notes.unshift({ content });
    await lead.save();

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Destroy lead row
 */
const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!lead) {
      res.status(404);
      throw new Error('Lead not found');
    }
    
    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
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

    res.status(200).json({
      success: true,
      message: 'Website audit refreshed successfully.',
      data: lead
    });
  } catch (error) {
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

    res.status(200).json({
      success: true,
      message: 'AI pitches generated successfully.',
      data: lead
    });
  } catch (error) {
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

    console.log(`[Manual AI] Force regenerating pitches and summary via Groq for: "${lead.businessName}"`);
    const aiResults = await analyzeLeadAndGeneratePitches(lead);

    lead.aiSummary = aiResults.aiSummary;
    lead.aiReason = aiResults.aiReason;
    lead.callPitch = aiResults.callPitch;
    lead.whatsappPitch = aiResults.whatsappPitch;
    lead.emailPitch = aiResults.emailPitch;
    lead.meetingPitch = aiResults.meetingPitch;

    await lead.save();

    res.status(200).json({
      success: true,
      message: 'AI pitches regenerated successfully.',
      data: lead
    });
  } catch (error) {
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

module.exports = {
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
};
