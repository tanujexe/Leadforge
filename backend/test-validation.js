const { 
  searchSchema, 
  statusUpdateSchema, 
  noteSchema, 
  bulkStatusSchema,
  pitchUpdateSchema
} = require('./middleware/validate');

console.log('--- RUNNING ZOD REQUEST SCHEMA VALIDATION TESTS ---');

let passed = true;

function runTest(testName, schema, testPayload, shouldPass) {
  try {
    schema.parse(testPayload);
    if (shouldPass) {
      console.log(`✅ Passed: ${testName} (Successfully validated)`);
    } else {
      passed = false;
      console.log(`❌ Failed: ${testName} (Payload should have failed validation but passed)`);
    }
  } catch (error) {
    if (!shouldPass) {
      console.log(`✅ Passed: ${testName} (Correctly rejected invalid payload)`);
    } else {
      passed = false;
      console.log(`❌ Failed: ${testName} (Valid payload was rejected: ${error.message})`);
    }
  }
}

// 1. Test Search Schema
runTest(
  'Search Case A: Valid search query',
  searchSchema,
  {
    body: { businessType: 'Dental Clinic', location: 'Gwalior' }
  },
  true
);

runTest(
  'Search Case B: Business type too short',
  searchSchema,
  {
    body: { businessType: 'd', location: 'Gwalior' }
  },
  false
);

// 2. Test Status Update Schema
runTest(
  'Status Case A: Valid status & MongoDB ID',
  statusUpdateSchema,
  {
    params: { id: '65b9c24df7511c97a829da42' },
    body: { status: 'Contacted' }
  },
  true
);

runTest(
  'Status Case B: Invalid pipeline status value',
  statusUpdateSchema,
  {
    params: { id: '65b9c24df7511c97a829da42' },
    body: { status: 'SentEmail' } // Not in enum
  },
  false
);

runTest(
  'Status Case C: Invalid MongoDB ID format',
  statusUpdateSchema,
  {
    params: { id: 'invalid-id-format' },
    body: { status: 'Follow Up' }
  },
  false
);

// 3. Test Note Content Schema
runTest(
  'Note Case A: Valid note',
  noteSchema,
  {
    params: { id: '65b9c24df7511c97a829da42' },
    body: { content: 'Called manager on Tuesday.' }
  },
  true
);

runTest(
  'Note Case B: Note empty content',
  noteSchema,
  {
    params: { id: '65b9c24df7511c97a829da42' },
    body: { content: '' }
  },
  false
);

// 4. Test Pitch Update Schema
runTest(
  'Pitch Case A: Valid custom pitch',
  pitchUpdateSchema,
  {
    params: { id: '65b9c24df7511c97a829da42' },
    body: { customPitch: 'Custom personalized outreach pitch for this business.' }
  },
  true
);

runTest(
  'Pitch Case B: Pitch content too long',
  pitchUpdateSchema,
  {
    params: { id: '65b9c24df7511c97a829da42' },
    body: { customPitch: 'a'.repeat(5001) }
  },
  false
);

if (passed) {
  console.log('\n🎉 ALL REQUEST VALIDATION SCHEMAS VERIFIED SUCCESSFULLY!\n');
} else {
  console.log('\n❌ SOME SCHEMA TESTS FAILED.\n');
  process.exit(1);
}
