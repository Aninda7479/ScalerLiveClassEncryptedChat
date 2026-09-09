// test/run_all.js
// Test runner to execute all test suites sequentially

const { execSync } = require('child_process');
const path = require('path');

const testSuites = [
  { name: 'Crypto Engine Tests', file: 'test_crypto.js' },
  { name: 'Expanded Edge-Case Tests', file: 'test_expanded.js' }
];

console.log('========================================================');
console.log('    Scaler Academy Encrypted Chat - Test Runner        ');
console.log('========================================================\n');

let failed = false;

for (const suite of testSuites) {
  const filePath = path.join(__dirname, suite.file);
  console.log(`▶ Running [${suite.name}] (${suite.file})...`);
  try {
    execSync(`node "${filePath}"`, { stdio: 'inherit' });
    console.log(`✔ [${suite.name}] Passed!\n`);
  } catch (err) {
    console.error(`✖ [${suite.name}] Failed!\n`);
    failed = true;
    break;
  }
}

if (failed) {
  console.error('❌ Test execution failed.');
  process.exit(1);
} else {
  console.log('========================================================');
  console.log('🎉 All test suites completed successfully!');
  console.log('========================================================');
}
