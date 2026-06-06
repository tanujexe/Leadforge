const { calculateLeadScore } = require('./utils/leadScorer');

const testCases = [
  {
    name: 'Case 1: No Website + High Rating + High Reviews',
    leadData: {
      website: null,
      rating: 4.8,
      reviewCount: 150,
      websiteStatus: 'No Website'
    },
    expectedScore: 85, // 50 (No Website) + 20 (Reviews > 100) + 15 (Rating > 4) = 85
    expectedOpp: 'High',
    expectedService: 'Website Development'
  },
  {
    name: 'Case 2: Outdated Website + High Rating + Low Reviews',
    leadData: {
      website: 'http://test.com',
      rating: 4.5,
      reviewCount: 20,
      websiteStatus: 'Outdated'
    },
    expectedScore: 30, // 0 (Has Website) + 0 (Reviews < 100) + 15 (Rating > 4) + 15 (Outdated Website) = 30
    expectedOpp: 'Low',
    expectedService: 'Website Redesign'
  },
  {
    name: 'Case 3: Slow Website + High Rating + High Reviews',
    leadData: {
      website: 'http://slow.com',
      rating: 4.2,
      reviewCount: 200,
      websiteStatus: 'Slow'
    },
    expectedScore: 45, // 0 (Has Website) + 20 (Reviews > 100) + 15 (Rating > 4) + 10 (Slow Website) = 45
    expectedOpp: 'Medium',
    expectedService: 'Speed & Performance Optimization'
  }
];

console.log('--- RUNNING LEAD SCORING SYSTEM UNIT TESTS ---');

let passed = true;

testCases.forEach((tc) => {
  const result = calculateLeadScore(tc.leadData);
  const scoreMatches = result.leadScore === tc.expectedScore;
  const oppMatches = result.opportunityLevel === tc.expectedOpp;
  const serviceMatches = result.recommendedService === tc.expectedService;

  if (scoreMatches && oppMatches && serviceMatches) {
    console.log(`✅ Passed: ${tc.name}`);
  } else {
    passed = false;
    console.log(`❌ Failed: ${tc.name}`);
    console.log(`   Expected: Score=${tc.expectedScore}, Opp=${tc.expectedOpp}, Service="${tc.expectedService}"`);
    console.log(`   Received: Score=${result.leadScore}, Opp=${result.opportunityLevel}, Service="${result.recommendedService}"`);
  }
});

if (passed) {
  console.log('\n🎉 ALL SCORING LOGIC TESTS PASSED SUCCESSFULLY!\n');
} else {
  console.log('\n❌ SOME SCORING LOGIC TESTS FAILED. PLEASE AUDIT SCORER UTILITY.\n');
  process.exit(1);
}
