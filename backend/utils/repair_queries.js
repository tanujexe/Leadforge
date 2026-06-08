const mongoose = require('mongoose');
const SearchQuery = require('../models/SearchQuery');
const Lead = require('../models/Lead');

async function repair() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/clientscout');
    console.log('Connected to database');

    const queries = await SearchQuery.find({});
    console.log(`Auditing ${queries.length} search queries...`);

    for (const q of queries) {
      const actualCount = await Lead.countDocuments({ searchQueryId: q._id });
      if (q.leadCount !== actualCount) {
        console.log(`- Query "${q.businessType} in ${q.location}" (${q._id}): updating leadCount from ${q.leadCount} to ${actualCount}`);
        q.leadCount = actualCount;
        await q.save();
      }
    }

    console.log('Database repair completed.');

  } catch (err) {
    console.error('Repair failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

repair();
