// Automated tests for Scaler Encrypted Chat Crypto Engine
const crypto = globalThis.crypto;

// Helper: UTF-8 encode / decode
const enc = new TextEncoder();
const dec = new TextDecoder();

// Helper: bytes <-> base64
function bytesToBase64(bytes) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Compute 8-char hex fingerprint of a password
async function computeFingerprint(password) {
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(password));
  const bytes = new Uint8Array(hash).subarray(0, 4);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Derive AES-GCM key from password + salt using PBKDF2
async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 50000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext with password
async function encryptMessage(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(plaintext)
  );

  // Layout: [salt (16 bytes) | iv (12 bytes) | ciphertext+tag]
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  const b64 = bytesToBase64(combined);
  const fingerprint = await computeFingerprint(password);

  return `🔒[ENC:v1:${fingerprint}:${b64}]`;
}

// Decrypt message given payload and password
async function decryptPayload(b64Payload, password) {
  const rawBytes = base64ToBytes(b64Payload);
  if (rawBytes.length < 28) {
    throw new Error('Payload too short');
  }
  const salt = rawBytes.subarray(0, 16);
  const iv = rawBytes.subarray(16, 28);
  const ciphertext = rawBytes.subarray(28);

  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );

  return dec.decode(decrypted);
}

// Parse encrypted blocks from text
const ENC_REGEX = /🔒\[ENC:v1:([0-9a-fA-F]{8}):([A-Za-z0-9+/=]+)\]/g;

// Match against multiple profiles
async function attemptDecryption(token, profiles) {
  const match = /🔒\[ENC:v1:([0-9a-fA-F]{8}):([A-Za-z0-9+/=]+)\]/.exec(token);
  if (!match) return null;

  const [_, fingerprint, b64] = match;

  // 1. Try fingerprint-matched profile first
  const matchedProfile = profiles.find(p => p.fingerprint.toLowerCase() === fingerprint.toLowerCase());
  if (matchedProfile) {
    try {
      const plaintext = await decryptPayload(b64, matchedProfile.key);
      return { success: true, plaintext, profile: matchedProfile };
    } catch (e) {
      // Fingerprint matched but decryption failed (collision or key changed)
    }
  }

  // 2. Fallback: try all other profiles
  for (const prof of profiles) {
    if (prof === matchedProfile) continue;
    try {
      const plaintext = await decryptPayload(b64, prof.key);
      return { success: true, plaintext, profile: prof };
    } catch (e) {
      // Ignore failure, try next
    }
  }

  return { success: false, fingerprint, b64 };
}

// Run test cases
async function runTests() {
  console.log('--- Starting Encrypted Chat Crypto Tests ---');

  // Test 1: Fingerprint calculation
  const fp1 = await computeFingerprint('secret123');
  console.log('Test 1 - Fingerprint for secret123:', fp1);
  if (fp1.length !== 8) throw new Error('Fingerprint must be 8 hex chars');

  // Test 2: Encrypt & Decrypt Round-trip
  const msg = 'Hey, check out question 3!';
  const encStr = await encryptMessage(msg, 'secret123');
  console.log('Test 2 - Encrypted string:', encStr);

  const match = /🔒\[ENC:v1:([0-9a-fA-F]{8}):([A-Za-z0-9+/=]+)\]/.exec(encStr);
  if (!match) throw new Error('Regex failed to match encrypted string');

  const decrypted = await decryptPayload(match[2], 'secret123');
  console.log('Test 2 - Decrypted plaintext:', decrypted);
  if (decrypted !== msg) throw new Error('Plaintext mismatch!');

  // Test 3: Incorrect password throws error safely
  let failedAsExpected = false;
  try {
    await decryptPayload(match[2], 'wrongPassword');
  } catch (err) {
    failedAsExpected = true;
  }
  console.log('Test 3 - Wrong password rejection:', failedAsExpected ? 'PASSED' : 'FAILED');
  if (!failedAsExpected) throw new Error('Decryption with wrong password should fail!');

  // Test 4: Multi-profile resolution
  const profiles = [
    { id: '1', name: 'Study Squad', key: 'squadSecret', fingerprint: await computeFingerprint('squadSecret'), color: '#10b981' },
    { id: '2', name: 'Private Alpha', key: 'alphaPass', fingerprint: await computeFingerprint('alphaPass'), color: '#8b5cf6' },
    { id: '3', name: 'Rahul Friend', key: 'rahul99', fingerprint: await computeFingerprint('rahul99'), color: '#3b82f6' }
  ];

  // Encrypt with profile 2
  const encAlpha = await encryptMessage('Alpha team update', 'alphaPass');
  const resultAlpha = await attemptDecryption(encAlpha, profiles);
  console.log('Test 4 - Attempt Alpha:', resultAlpha.success, 'Profile:', resultAlpha.profile?.name, 'Text:', resultAlpha.plaintext);
  if (!resultAlpha.success || resultAlpha.profile.name !== 'Private Alpha') {
    throw new Error('Multi-profile resolution failed for Alpha!');
  }

  // Encrypt with unknown profile
  const encUnknown = await encryptMessage('Secret for someone else', 'unknownKey');
  const resultUnknown = await attemptDecryption(encUnknown, profiles);
  console.log('Test 5 - Attempt Unknown Key:', resultUnknown.success, 'Fingerprint:', resultUnknown.fingerprint);
  if (resultUnknown.success) {
    throw new Error('Should not have decrypted unknown key!');
  }

  // On-the-fly unlock with unknown key
  const unlocked = await decryptPayload(resultUnknown.b64, 'unknownKey');
  console.log('Test 6 - On-the-fly manual unlock:', unlocked);
  if (unlocked !== 'Secret for someone else') {
    throw new Error('Manual unlock failed!');
  }

  console.log('--- All 6 Tests Passed Successfully! ---');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
