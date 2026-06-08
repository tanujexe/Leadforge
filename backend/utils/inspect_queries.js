const mongoose = require('mongoose');
const SearchQuery = require('../models/SearchQuery');
const Lead = require('../models/Lead');

async function inspect() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/clientscout');
    console.log('Connected to database');

    const queries = await SearchQuery.find({}).sort({ createdAt: 1 });
    console.log('Search Queries Log:');
    console.log('--------------------------------------------------');
    for (const q of queries) {
      const actualCount = await Lead.countDocuments({ searchQueryId: q._id });
      console.log(`ID: ${q._id}`);
      console.log(`Query: "${q.businessType} in ${q.location}"`);
      console.log(`Status: ${q.status}`);
      console.log(`leadCount (stored): ${q.leadCount}`);
      console.log(`actualLeads (DB): ${actualCount}`);
      console.log(`rawDiscoveredCount: ${q.rawDiscoveredCount}`);
      console.log(`creditsUsed: ${q.creditsUsed}`);
      console.log(`createdAt: ${q.createdAt}`);
      console.log('--------------------------------------------------');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

inspect();
