const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const SearchQuery = require('../models/SearchQuery');

async function analyze() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/clientscout');
    console.log('Connected to database');

    const totalLeads = await Lead.countDocuments({});
    const deletedLeads = await Lead.countDocuments({ isDeleted: true });
    const activeLeads = await Lead.countDocuments({ isDeleted: { $ne: true } });

    console.log(`Total leads in DB (all): ${totalLeads}`);
    console.log(`Deleted leads: ${deletedLeads}`);
    console.log(`Active leads: ${activeLeads}`);

    console.log('\nSearch queries breakdown (including deleted):');
    const searchQueries = await SearchQuery.find({});
    for (const q of searchQueries) {
      const activeCount = await Lead.countDocuments({ searchQueryId: q._id, isDeleted: { $ne: true } });
      const deletedCount = await Lead.countDocuments({ searchQueryId: q._id, isDeleted: true });
      const totalCount = await Lead.countDocuments({ searchQueryId: q._id });
      console.log(`- Query ID ${q._id} (${q.businessType} in ${q.location}): leadCount=${q.leadCount}, active=${activeCount}, deleted=${deletedCount}, total=${totalCount}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

analyze();
