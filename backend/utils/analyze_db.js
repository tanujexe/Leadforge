const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const SearchQuery = require('../models/SearchQuery');

async function analyze() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/clientscout');
    console.log('Connected to database');

    const totalLeads = await Lead.countDocuments({ isDeleted: { $ne: true } });
    console.log(`Total Leads: ${totalLeads}`);

    const hasWebsiteQuery = {
      isDeleted: { $ne: true },
      website: { $exists: true, $nin: [null, '', 'null'] }
    };
    const hasWebsiteCount = await Lead.countDocuments(hasWebsiteQuery);
    console.log(`Leads with website: ${hasWebsiteCount}`);

    const noWebsiteQuery = {
      isDeleted: { $ne: true },
      $or: [
        { website: { $exists: false } },
        { website: null },
        { website: '' },
        { website: 'null' }
      ]
    };
    const noWebsiteCount = await Lead.countDocuments(noWebsiteQuery);
    console.log(`Leads without website: ${noWebsiteCount}`);

    const websiteStatusGroup = await Lead.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$websiteStatus', count: { $sum: 1 } } }
    ]);
    console.log('Website Status Breakdown:');
    console.log(websiteStatusGroup);

    const opportunityGroup = await Lead.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$opportunityLevel', count: { $sum: 1 } } }
    ]);
    console.log('Opportunity Level Breakdown:');
    console.log(opportunityGroup);

    const statusGroup = await Lead.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('Status Breakdown:');
    console.log(statusGroup);

    const searchQueries = await SearchQuery.find({});
    console.log(`Total Search Queries: ${searchQueries.length}`);
    for (const q of searchQueries) {
      const countForQuery = await Lead.countDocuments({ searchQueryId: q._id, isDeleted: { $ne: true } });
      console.log(`- Query ID ${q._id} (${q.businessType} in ${q.location}): limit=${q.limit}, leadCount=${q.leadCount}, actualLeads=${countForQuery}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

analyze();
