const { correctBusinessType } = require('./utils/typoCorrector');

const testCases = [
  { input: 'gum', expected: 'gym' },
  { input: 'caffe', expected: 'cafe' },
  { input: 'best resturant', expected: 'best restaurant' },
  { input: 'Fitness Gymm', expected: 'fitness gym' },
  { input: 'dentistt near me', expected: 'dentist near me' },
  { input: 'SALOON', expected: 'salon' },
  { input: 'normal category', expected: 'normal category' }
];

console.log('--- RUNNING TYPO CORRECTOR TESTS ---');
let allPassed = true;

testCases.forEach(({ input, expected }, idx) => {
  const result = correctBusinessType(input);
  if (result === expected) {
    console.log(`✅ Passed Case ${idx + 1}: "${input}" -> "${result}"`);
  } else {
    console.log(`❌ Failed Case ${idx + 1}: "${input}" -> Got "${result}", expected "${expected}"`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('\n🎉 ALL TYPO CORRECTION TESTS PASSED!');
} else {
  console.log('\n⚠️ Some tests failed. Please review the implementation.');
}
