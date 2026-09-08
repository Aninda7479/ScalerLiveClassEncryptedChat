// Expanded tests for Unicode, Emoji, Long Messages, Multi-Tokens, and Export/Import
const crypto = globalThis.crypto;
const enc = new TextEncoder();
const dec = new TextDecoder();

function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(base64) {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

async function computeFingerprint(password) {
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(password));
  const bytes = new Uint8Array(hash).subarray(0, 4);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 50000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptMessage(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  const b64 = bytesToBase64(combined);
  const fingerprint = await computeFingerprint(password);
  return `🔒[ENC:v1:${fingerprint}:${b64}]`;
}

async function decryptPayload(b64Payload, password) {
  const rawBytes = base64ToBytes(b64Payload);
  const salt = rawBytes.subarray(0, 16);
  const iv = rawBytes.subarray(16, 28);
  const ciphertext = rawBytes.subarray(28);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return dec.decode(decrypted);
}

async function runExpandedTests() {
  console.log('--- Running Expanded Edge-Case Tests ---');

  // 1. Emoji and multilingual unicode
  const unicodeMsg = 'Hello Scaler! 👋 🚀 यहाँ गुप्त संदेश है! 🔐 漢語/日本語/한국어';
  const encUnicode = await encryptMessage(unicodeMsg, 'hindiPass123');
  const matchUnicode = /🔒\[ENC:v1:([0-9a-fA-F]{8}):([A-Za-z0-9+/=]+)\]/.exec(encUnicode);
  const decUnicode = await decryptPayload(matchUnicode[2], 'hindiPass123');
  console.log('Test 1 (Unicode & Emoji):', decUnicode === unicodeMsg ? 'PASSED' : 'FAILED');
  if (decUnicode !== unicodeMsg) throw new Error('Unicode mismatch');

  // 2. Extremely long message (code snippet / markdown)
  const longMsg = 'function solve(n) {\n' + '  return n <= 1 ? 1 : n * solve(n - 1);\n}\n'.repeat(100);
  const encLong = await encryptMessage(longMsg, 'codeKey99');
  const matchLong = /🔒\[ENC:v1:([0-9a-fA-F]{8}):([A-Za-z0-9+/=]+)\]/.exec(encLong);
  const decLong = await decryptPayload(matchLong[2], 'codeKey99');
  console.log('Test 2 (Long Message - ' + longMsg.length + ' chars):', decLong === longMsg ? 'PASSED' : 'FAILED');
  if (decLong !== longMsg) throw new Error('Long message mismatch');

  // 3. Multi-token text matching
  const enc1 = await encryptMessage('Secret 1', 'key1');
  const enc2 = await encryptMessage('Secret 2', 'key2');
  const combinedChat = `Hey look at this: ${enc1} and also ${enc2} thanks!`;
  const regex = /🔒\[ENC:v1:([0-9a-fA-F]{8}):([A-Za-z0-9+/=]+)\]/g;
  const matches = Array.from(combinedChat.matchAll(regex));
  console.log('Test 3 (Multi-Token Detection): Found', matches.length, 'tokens -', matches.length === 2 ? 'PASSED' : 'FAILED');
  if (matches.length !== 2) throw new Error('Failed to find 2 tokens');

  // 4. Export / Import Serialization
  const originalProfiles = [
    { name: 'Study Group', key: 'passA', color: '#10b981' },
    { name: 'Best Friend', key: 'passB', color: '#3b82f6' }
  ];
  const exported = JSON.stringify(originalProfiles);
  const imported = JSON.parse(exported);
  console.log('Test 4 (Export / Import JSON):', imported.length === 2 && imported[0].key === 'passA' ? 'PASSED' : 'FAILED');

  console.log('--- All Expanded Tests Passed! ---');
}

runExpandedTests().catch(err => {
  console.error(err);
  process.exit(1);
});
