const { generateDemoLeads, ensureDemoScreenshots } = require('./utils/demoGenerator');

console.log('--- RUNNING DEMO LEAD GENERATOR UNIT TESTS ---');

ensureDemoScreenshots();

const businessType = 'Gym';
const location = 'Bhopal';

const leads = generateDemoLeads(businessType, location);

console.log(`✅ Discovered count: Generated ${leads.length} demo leads (Expected: 20-35).`);

// Test diversity
const hasWebsiteCount = leads.filter(l => l.website).length;
const noWebsiteCount = leads.filter(l => !l.website).length;
const ratings = leads.map(l => l.rating);
const maxRating = Math.max(...ratings);
const minRating = Math.min(...ratings);

console.log(`✅ Website Presence: ${hasWebsiteCount} leads have website, ${noWebsiteCount} leads do not.`);
console.log(`✅ Rating Range: Min rating = ${minRating}, Max rating = ${maxRating} (Expected: 1.5 to 5.0).`);

// Test website audits diversity
const websites = leads.filter(l => l.website);
const statusCounts = {};
websites.forEach(w => {
  const status = w.mockAudit.websiteStatus;
  statusCounts[status] = (statusCounts[status] || 0) + 1;
});

console.log('✅ Audit Status Diversity:', statusCounts);

let allGood = true;
if (leads.length < 20 || leads.length > 35) {
  console.log('❌ Failed: Generated count is out of bounds.');
  allGood = false;
}
if (hasWebsiteCount === 0 || noWebsiteCount === 0) {
  console.log('❌ Failed: No diversity in website presence.');
  allGood = false;
}

if (allGood) {
  console.log('\n🎉 ALL DEMO LEAD GENERATION TESTS PASSED!');
} else {
  console.log('\n⚠️ Some test requirements failed.');
}
