const mongoose = require('mongoose');
const Lead = require('../models/Lead');

async function checkLinks() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/clientscout');
    console.log('Connected to database');

    const leads = await Lead.find({});
    console.log(`Total Leads: ${leads.length}`);

    const counts = {};
    for (const lead of leads) {
      if (!lead.searchQueryId || lead.searchQueryId.length === 0) {
        counts['None'] = (counts['None'] || 0) + 1;
      } else {
        for (const id of lead.searchQueryId) {
          counts[id.toString()] = (counts[id.toString()] || 0) + 1;
        }
      }
    }

    console.log('Lead count by searchQueryId in database:');
    console.log(counts);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkLinks();
