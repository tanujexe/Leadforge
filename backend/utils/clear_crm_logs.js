const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const mongoose = require('mongoose');

const ActivityLog = require('../models/ActivityLog');
const Lead = require('../models/Lead');

const clearCrm = async () => {
  const primaryConnStr = process.env.MONGODB_URI;
  const fallbackConnStr = 'mongodb://127.0.0.1:27017/clientscout';
  const connStr = primaryConnStr || fallbackConnStr;

  console.log(`Connecting to MongoDB...`);
  try {
    if (primaryConnStr) {
      console.log('Connecting to primary MongoDB (Atlas)...');
      await mongoose.connect(primaryConnStr, { serverSelectionTimeoutMS: 3000 });
      console.log('✅ Connected to primary MongoDB.');
    } else {
      throw new Error('No primary URI configured');
    }
  } catch (error) {
    console.warn(`⚠️ Primary MongoDB Connection failed: ${error.message}. Falling back to local...`);
    await mongoose.connect(fallbackConnStr, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ Connected to local fallback MongoDB.');
  }

  // 1. Wipe Activity Logs
  const deleteLogsResult = await ActivityLog.deleteMany({});
  console.log(`🧹 Deleted ${deleteLogsResult.deletedCount} activity logs.`);

  // 2. Reset Leads follow-ups, calls, and owner/assignee fields if desired
  const resetLeadsResult = await Lead.updateMany(
    { isDeleted: { $ne: true } },
    { 
      $set: { 
        followUpDate: null, 
        totalCalls: 0 
      } 
    }
  );
  console.log(`🔄 Reset follow-ups and call counts on ${resetLeadsResult.modifiedCount} leads.`);

  // Also transition leads whose status was 'Follow Up' back to 'New'
  const transitionResult = await Lead.updateMany(
    { isDeleted: { $ne: true }, status: 'Follow Up' },
    { $set: { status: 'New' } }
  );
  console.log(`🔄 Transitioned ${transitionResult.modifiedCount} "Follow Up" leads back to "New".`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
};

clearCrm().catch(err => {
  console.error('❌ Error executing clear script:', err);
  process.exit(1);
});
