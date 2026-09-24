// Automated Tests for Userscript Parity, Synchronization, and Optimization
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { buildUserscript } = require('../build_userscript');

async function runUserscriptSyncTests() {
  console.log('--- Running Userscript Parity & Sync Tests ---');

  const rootDir = path.resolve(__dirname, '..');
  const manifestPath = path.join(rootDir, 'chrome-extension', 'manifest.json');
  const cssPath = path.join(rootDir, 'chrome-extension', 'content.css');
  const jsPath = path.join(rootDir, 'chrome-extension', 'content.js');
  const userScriptPath = path.join(rootDir, 'scaler-encrypted-chat.user.js');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const userScript = fs.readFileSync(userScriptPath, 'utf8');

  // Test 1: Version parity
  const expectedVersion = manifest.version;
  const versionMatch = userScript.match(/\/\/\s*@version\s+([0-9.]+)/);
  if (!versionMatch || versionMatch[1] !== expectedVersion) {
    throw new Error(`Version mismatch: manifest has ${expectedVersion}, userscript has ${versionMatch ? versionMatch[1] : 'null'}`);
  }
  console.log(`Test 1 (Version Parity): v${expectedVersion} matched - PASSED`);

  // Test 2: Required Userscript Grants
  const requiredGrants = [
    'GM_setValue',
    'GM_getValue',
    'GM_addValueChangeListener',
    'GM_addStyle',
    'GM_setClipboard',
    'GM_registerMenuCommand'
  ];
  for (const grant of requiredGrants) {
    if (!userScript.includes(`// @grant        ${grant}`)) {
      throw new Error(`Missing required grant: ${grant}`);
    }
  }
  console.log(`Test 2 (Required GM Grants): All ${requiredGrants.length} grants present - PASSED`);

  // Test 3: Match Patterns Parity (Apex + Subdomain)
  if (!userScript.includes('// @match        *://scaler.com/*') || !userScript.includes('// @match        *://*.scaler.com/*')) {
    throw new Error('Missing apex or wildcard protocol match for scaler.com');
  }
  console.log('Test 3 (Match Patterns Parity): PASSED');

  // Test 4: CSS Embedded & GM_addStyle Optimization
  if (!userScript.includes('GM_addStyle') || !userScript.includes('scaler-enc-robust-styles')) {
    throw new Error('GM_addStyle or style injection missing from userscript');
  }
  // Verify CSS content is inside userscript
  const testSelector = '.scaler-enc-controls-wrapper';
  if (!userScript.includes(testSelector)) {
    throw new Error(`Expected CSS selector ${testSelector} not found in userscript`);
  }
  console.log('Test 4 (CSS & GM_addStyle Integration): PASSED');

  // Test 5: Storage Synchronization across tabs
  if (!userScript.includes('GM_addValueChangeListener') || !userScript.includes('setupStorageSync')) {
    throw new Error('Cross-tab sync logic missing from userscript');
  }
  console.log('Test 5 (Cross-Tab Live Profile Sync): PASSED');

  // Test 6: Safe Clipboard Helper
  if (!userScript.includes('safeCopyToClipboard') || !userScript.includes('GM_setClipboard')) {
    throw new Error('safeCopyToClipboard with GM_setClipboard missing from userscript');
  }
  console.log('Test 6 (Safe Clipboard Integration): PASSED');

  // Test 7: Tampermonkey Menu Commands
  if (!userScript.includes('registerUserscriptMenuCommands') || !userScript.includes('GM_registerMenuCommand')) {
    throw new Error('Tampermonkey menu commands missing from userscript');
  }
  console.log('Test 7 (Tampermonkey Context Menu Commands): PASSED');

  // Test 8: Deterministic Build Check
  const rebuilt = buildUserscript();
  if (rebuilt !== userScript) {
    throw new Error('Userscript on disk differs from buildUserscript() output. Please re-run build_userscript.js.');
  }
  console.log('Test 8 (Deterministic Build Check): PASSED');

  // Test 9: Syntax Validation via Node vm
  try {
    new vm.Script(userScript);
    console.log('Test 9 (Syntax Validation): PASSED');
  } catch (err) {
    throw new Error(`Userscript syntax validation failed: ${err.message}`);
  }

  // Test 10: In-Modal Update Checker & Test Helpers Expose
  if (!userScript.includes('checkForUserscriptUpdate') || !userScript.includes('scaler-enc-check-update-btn')) {
    throw new Error('Update checker engine or in-modal button missing from userscript');
  }
  if (!userScript.includes('window.scalerEncryptTextTest = encryptText') || !userScript.includes('window.scalerSplitChunksTest = splitDataIntoChunks')) {
    throw new Error('Test helpers not exported inside userscript scope');
  }
  console.log('Test 10 (In-Modal Update Checker & Test Helpers): PASSED');

  console.log('--- All 10 Userscript Parity & Sync Tests Passed Successfully! ---');
  return true;
}

if (require.main === module) {
  runUserscriptSyncTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}

module.exports = { runUserscriptSyncTests };
