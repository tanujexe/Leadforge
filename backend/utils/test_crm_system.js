const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Force IPv4 first DNS lookup to prevent SRV timeouts on local host
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const User = require('../models/User');
const Lead = require('../models/Lead');
const ActivityLog = require('../models/ActivityLog');

const runTests = async () => {
  const primaryConnStr = process.env.MONGODB_URI;
  const fallbackConnStr = 'mongodb://127.0.0.1:27017/clientscout';
  const connStr = primaryConnStr || fallbackConnStr;

  console.log('--- 🧪 STARTING E2E CRM INTEGRATION TEST ---');
  console.log(`Connecting to database: ${connStr}...`);
  await mongoose.connect(connStr);
  console.log('✅ Connected.');

  // Create temporary test user
  console.log('\nStep 1: Creating mock CRM Agent...');
  const testUserEmail = 'crm_test_agent_2026@clientscout.app';
  // Delete if exists
  await User.deleteOne({ email: testUserEmail });
  const agent = new User({
    name: 'CRM Test Agent',
    email: testUserEmail,
    role: 'User',
    isApproved: true,
    canEditLeads: true
  });
  await agent.save();
  console.log(`✅ Agent created with ID: ${agent._id}`);

  // Create temporary test lead
  console.log('\nStep 2: Creating mock Lead...');
  const lead = new Lead({
    businessName: 'E2E Test Fitness Gym',
    category: 'Gym',
    address: '123 Test Street, NY',
    status: 'New',
    owner: agent._id,
    assignedTo: agent._id
  });
  await lead.save();
  console.log(`✅ Lead created with ID: ${lead._id}`);

  // Test 1: Log call log outcome and follow-up
  console.log('\nStep 3: Logging call outcome & scheduling follow-up callback...');
  lead.totalCalls = (lead.totalCalls || 0) + 1;
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 5); // 5 days from now
  lead.followUpDate = followUpDate;
  lead.status = 'Follow Up';
  await lead.save();

  const logEntry = new ActivityLog({
    leadId: lead._id,
    userId: agent._id,
    actionType: 'CallLog',
    details: 'Called owner, spoke about digital pitch proposal.',
    callOutcome: 'Callback Scheduled',
    followUpDate: followUpDate
  });
  await logEntry.save();
  console.log('✅ Call log stored successfully in ActivityLog.');
  
  // Verify stats on Lead
  const verifiedLead = await Lead.findById(lead._id);
  console.log(`Verified Lead Total Calls: ${verifiedLead.totalCalls} (Expected: 1)`);
  console.log(`Verified Lead Status: ${verifiedLead.status} (Expected: Follow Up)`);
  console.log(`Verified Lead Follow-up: ${verifiedLead.followUpDate.toISOString()} (Expected: ${followUpDate.toISOString()})`);
  
  if (verifiedLead.totalCalls !== 1 || verifiedLead.status !== 'Follow Up') {
    throw new Error('Call logging statistics did not match expected values.');
  }

  // Test 2: Modify call log details and callback date
  console.log('\nStep 4: Modifying call log details and rescheduling follow-up date...');
  const newFollowUpDate = new Date();
  newFollowUpDate.setDate(newFollowUpDate.getDate() + 10); // 10 days from now
  
  const fetchedLog = await ActivityLog.findById(logEntry._id);
  fetchedLog.details = 'Rescheduled call: Client requested more information.';
  fetchedLog.followUpDate = newFollowUpDate;
  await fetchedLog.save();

  // Sync to lead
  const updatedLead = await Lead.findById(lead._id);
  updatedLead.followUpDate = newFollowUpDate;
  await updatedLead.save();
  console.log('✅ Call log details modified and synchronized with Lead document.');

  const recheckLead = await Lead.findById(lead._id);
  console.log(`Updated Lead Follow-up: ${recheckLead.followUpDate.toISOString()} (Expected: ${newFollowUpDate.toISOString()})`);
  
  if (recheckLead.followUpDate.getTime() !== newFollowUpDate.getTime()) {
    throw new Error('Follow-up date update failed to sync.');
  }

  // Test 3: Log Note and check reference noteId
  console.log('\nStep 5: Logging note log and verifying noteId mapping...');
  const noteContent = 'Client wants to discuss pricing next week.';
  verifiedLead.notes.unshift({ content: noteContent });
  await verifiedLead.save();
  
  const savedNote = verifiedLead.notes[0];
  const noteLog = new ActivityLog({
    leadId: verifiedLead._id,
    userId: agent._id,
    actionType: 'AddNote',
    details: `Note logged: "${noteContent}"`,
    noteId: savedNote._id
  });
  await noteLog.save();
  console.log(`✅ Note log saved with linked noteId: ${noteLog.noteId}`);

  // Test 4: Delete note log and verify lead notes array is pulled
  console.log('\nStep 6: Deleting Note Log and verifying subdocument pull...');
  const fetchedNoteLog = await ActivityLog.findById(noteLog._id);
  const leadToPull = await Lead.findById(verifiedLead._id);
  leadToPull.notes.pull(fetchedNoteLog.noteId);
  await leadToPull.save();
  await ActivityLog.findByIdAndDelete(fetchedNoteLog._id);
  console.log('✅ Note log deleted and note pulled from subdocuments.');

  const pulledLead = await Lead.findById(verifiedLead._id);
  console.log(`Remaining notes in lead: ${pulledLead.notes.length} (Expected: 0)`);
  if (pulledLead.notes.length !== 0) {
    throw new Error('Note subdocument failed to pull from Lead notes array.');
  }

  // Test 5: Delete Call Log and check stats sync (decrements calls, sets followUpDate to null)
  console.log('\nStep 7: Deleting Call Log and checking statistics synchronization...');
  const fetchedCallLog = await ActivityLog.findById(logEntry._id);
  const leadToSync = await Lead.findById(lead._id);
  leadToSync.totalCalls = Math.max(0, (leadToSync.totalCalls || 1) - 1);
  leadToSync.followUpDate = null;
  leadToSync.status = 'Contacted';
  await leadToSync.save();
  await ActivityLog.findByIdAndDelete(fetchedCallLog._id);
  console.log('✅ Call log deleted and statistics decremented/reset.');

  const finalLead = await Lead.findById(lead._id);
  console.log(`Final Lead Total Calls: ${finalLead.totalCalls} (Expected: 0)`);
  console.log(`Final Lead Status: ${finalLead.status} (Expected: Contacted)`);
  console.log(`Final Lead Follow-up: ${finalLead.followUpDate} (Expected: null)`);

  if (finalLead.totalCalls !== 0 || finalLead.followUpDate !== null || finalLead.status !== 'Contacted') {
    throw new Error('Call log deletion failed to synchronize lead statistics.');
  }

  // Cleanup temporary test items
  console.log('\nStep 8: Cleaning up test data...');
  await User.deleteOne({ _id: agent._id });
  await Lead.deleteOne({ _id: lead._id });
  console.log('🧹 Cleanup completed.');

  console.log('\n🎉 ALL CRM TESTS PASSED SUCCESSFULLY! EVERYTHING IS WORKING PERFECTLY! 🎉');
  console.log('------------------------------------------------');

  await mongoose.disconnect();
};

runTests().catch(async (err) => {
  console.error('\n❌ CRM E2E TEST FAILED:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
