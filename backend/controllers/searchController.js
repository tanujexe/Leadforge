const mongoose = require('mongoose');
const SearchQuery = require('../models/SearchQuery');
const Lead = require('../models/Lead');
const { searchGoogleMaps } = require('../services/apify/apifyService');
const { auditWebsite } = require('../services/audit/auditService');
const { analyzeLeadAndGeneratePitches } = require('../services/groq/groqService');
const { calculateLeadScore } = require('../utils/leadScorer');
const { correctBusinessType } = require('../utils/typoCorrector');

/**
 * Background worker task executing Google Maps searches, auditing, and AI synthesis
 */
async function runSearchWorker(searchId, businessType, location) {
  try {
    // Check for duplicate search queries in the last 7 days (Case-Insensitive)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const duplicateQueries = await SearchQuery.find({
      businessType: { $regex: new RegExp('^' + businessType.trim() + '$', 'i') },
      location: { $regex: new RegExp('^' + location.trim() + '$', 'i') },
      status: 'Completed',
      createdAt: { $gte: sevenDaysAgo }
    });

    if (duplicateQueries.length > 0) {
      console.log(`[Search Worker] Found ${duplicateQueries.length} recent matching search queries. Reusing leads.`);
      await SearchQuery.findByIdAndUpdate(searchId, { status: 'Scraping' });
      
      const duplicateQueryIds = duplicateQueries.map(q => q._id);
      const leadsToReuse = await Lead.find({ searchQueryId: { $in: duplicateQueryIds } });
      
      if (leadsToReuse.length > 0) {
        await SearchQuery.findByIdAndUpdate(searchId, { 
          status: 'Auditing',
          leadCount: leadsToReuse.length 
        });
        
        // Link existing leads to the new search query
        for (const lead of leadsToReuse) {
          lead.searchQueryId = searchId;
          await lead.save();
        }
      }

      await SearchQuery.findByIdAndUpdate(searchId, { 
        status: 'Completed', 
        leadCount: leadsToReuse.length 
      });
      return;
    }

    // 1. Scraping google maps listings or generating mock demo leads
    await SearchQuery.findByIdAndUpdate(searchId, { status: 'Scraping' });
    
    const isDemoMode = process.env.DEVELOPMENT_MODE === 'true';
    let discoveredBusinesses = [];

    if (isDemoMode) {
      console.log(`[Search Worker] DEVELOPMENT_MODE is active. Generating mock leads for: "${businessType}" in "${location}"`);
      const { generateDemoLeads } = require('../utils/demoGenerator');
      discoveredBusinesses = generateDemoLeads(businessType, location);
    } else {
      discoveredBusinesses = await searchGoogleMaps(businessType, location);
    }
    
    if (!discoveredBusinesses || discoveredBusinesses.length === 0) {
      await SearchQuery.findByIdAndUpdate(searchId, { status: 'Completed', leadCount: 0 });
      return;
    }

    // 2. Set status to Auditing
    await SearchQuery.findByIdAndUpdate(searchId, { 
      status: 'Auditing',
      leadCount: discoveredBusinesses.length 
    });

    let processedCount = 0;

    for (const biz of discoveredBusinesses) {
      try {
        // Enforce database-first check for deduplication
        let existingLead = null;

        // Priority 1: Google Maps URL
        if (biz.googleMapsUrl) {
          existingLead = await Lead.findOne({ googleMapsUrl: biz.googleMapsUrl });
        }

        // Priority 2: Phone Number
        if (!existingLead && biz.phone) {
          existingLead = await Lead.findOne({ phone: biz.phone });
        }

        // Priority 3: Name + Address
        if (!existingLead && biz.businessName && biz.address) {
          existingLead = await Lead.findOne({ 
            businessName: biz.businessName, 
            address: biz.address 
          });
        }

        // If lead already exists, link to query and SKIP expensive API calls
        if (existingLead) {
          console.log(`[Search Worker] Business already exists: "${biz.businessName}". Linking and skipping API calls.`);
          existingLead.searchQueryId = searchId;
          await existingLead.save();
          processedCount++;
          continue;
        }

        // Pre-generate Lead ID to name screenshot files
        const leadId = new mongoose.Types.ObjectId();

        // Run website audit if website exists (or reuse mock audit if demo lead)
        let auditResult = null;
        if (biz.website) {
          if (biz.isDemo) {
            auditResult = biz.mockAudit;
          } else {
            console.log(`[Search Worker] Auditing website for: "${biz.businessName}"`);
            auditResult = await auditWebsite(biz.website, leadId);
          }
        } else {
          auditResult = {
            websiteScore: 0,
            websiteStatus: 'No Website',
            issues: ['No website URL on Google Maps profile']
          };
        }

        // Prepare lead database model
        const lead = new Lead({
          _id: leadId,
          businessName: biz.businessName,
          phone: biz.phone || '',
          website: biz.website || null,
          address: biz.address || '',
          googleMapsUrl: biz.googleMapsUrl || '',
          rating: biz.rating || 0,
          reviewCount: biz.reviewCount || 0,
          category: biz.category || businessType,
          searchQueryId: searchId,
          websiteScore: auditResult.websiteScore,
          websiteStatus: auditResult.websiteStatus,
          screenshotFull: auditResult.screenshotFull || null,
          screenshotThumb: auditResult.screenshotThumb || null,
          status: 'New',
          audit: auditResult,
          lastAuditAt: biz.website ? new Date() : null
        });

        // Calculate opportunity scores deterministically on backend
        const scoreResult = calculateLeadScore(lead);
        lead.leadScore = scoreResult.leadScore;
        lead.opportunityLevel = scoreResult.opportunityLevel;
        lead.recommendedService = scoreResult.recommendedService;

        // Perform Groq AI pitch analysis (only once per lead, falls back to templates if key is missing)
        console.log(`[Search Worker] Running AI analysis for: "${biz.businessName}"`);
        const aiResults = await analyzeLeadAndGeneratePitches(lead);
        
        lead.aiSummary = aiResults.aiSummary;
        lead.aiReason = aiResults.aiReason;
        lead.callPitch = aiResults.callPitch;
        lead.whatsappPitch = aiResults.whatsappPitch;
        lead.emailPitch = aiResults.emailPitch;
        lead.meetingPitch = aiResults.meetingPitch;

        // Persist new Lead to MongoDB
        await lead.save();
      } catch (err) {
        console.error(`[Search Worker] Error processing: "${biz.businessName}":`, err.message);
      }
      
      processedCount++;
    }

    // Set search completed
    await SearchQuery.findByIdAndUpdate(searchId, { status: 'Completed', leadCount: processedCount });
  } catch (error) {
    console.error('[Search Worker] Background search failed:', error.message);
    await SearchQuery.findByIdAndUpdate(searchId, { status: 'Failed' });
  }
}

/**
 * Creates search job and dispatches worker
 */
const createSearch = async (req, res, next) => {
  try {
    const { businessType: rawBusinessType, location } = req.body;
    if (!rawBusinessType || !location) {
      res.status(400);
      throw new Error('Please provide both businessType and location');
    }

    // Auto-correct common spelling mistakes (e.g., gum -> gym, caffe -> cafe)
    const businessType = correctBusinessType(rawBusinessType);

    // Check for duplicate search query in the last 7 days BEFORE checking credentials
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentQuery = await SearchQuery.findOne({
      businessType: { $regex: new RegExp('^' + businessType.trim() + '$', 'i') },
      location: { $regex: new RegExp('^' + location.trim() + '$', 'i') },
      status: 'Completed',
      createdAt: { $gte: sevenDaysAgo }
    });

    // Validate Apify token exists only if we don't have a cached query AND we are not in development demo mode
    const token = process.env.APIFY_TOKEN;
    const isTokenMissing = !token || token.trim() === '' || token === 'your_apify_api_token';
    const isDemoMode = process.env.DEVELOPMENT_MODE === 'true';

    if (isTokenMissing && !recentQuery && !isDemoMode) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_API_CREDENTIALS',
        message: 'APIFY_TOKEN is not configured in backend/.env configuration.',
        instructions: {
          apify: 'Please obtain your Apify Token at https://console.apify.com/settings/integrations and add it as APIFY_TOKEN in your backend/.env file.'
        }
      });
    }

    // Create pending query search log
    const searchQuery = await SearchQuery.create({
      businessType: businessType.trim(),
      location: location.trim(),
      status: 'Pending'
    });

    // Run background worker asynchronously
    runSearchWorker(searchQuery._id, businessType.trim(), location.trim());

    res.status(202).json({
      success: true,
      message: 'Scan query dispatched successfully.',
      data: {
        searchId: searchQuery._id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns scan progress and lead items
 */
const getSearchQueryStatus = async (req, res, next) => {
  try {
    const searchQuery = await SearchQuery.findById(req.params.id);
    if (!searchQuery) {
      res.status(404);
      throw new Error('Search query log not found');
    }

    // Find leads linked to this search query (exclude soft-deleted ones)
    const leads = await Lead.find({ searchQueryId: searchQuery._id, isDeleted: { $ne: true } }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        _id: searchQuery._id,
        businessType: searchQuery.businessType,
        location: searchQuery.location,
        status: searchQuery.status,
        leadCount: searchQuery.leadCount,
        processedLeadsCount: leads.length,
        leads: leads
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetches recent searches
 */
const getRecentSearches = async (req, res, next) => {
  try {
    const history = await SearchQuery.find().sort({ createdAt: -1 }).limit(10);
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSearch,
  getSearchQueryStatus,
  getRecentSearches
};
