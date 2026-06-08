const mongoose = require('mongoose');
const Lead = require('../models/Lead');

async function findRealEstate() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/clientscout');
    console.log('Connected to database');

    const leads = await Lead.find({
      $or: [
        { category: /real/i },
        { category: /estate/i },
        { businessName: /real/i },
        { businessName: /estate/i }
      ]
    });

    console.log(`Found ${leads.length} real estate leads in total.`);
    for (const l of leads) {
      console.log(`- ID: ${l._id}, Name: "${l.businessName}", Category: "${l.category}", QueryIDs: ${JSON.stringify(l.searchQueryId)}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

findRealEstate();
