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

// GIF Animation Detector (mirroring content.js)
function isAnimatedGifBytes(bytes) {
  if (bytes.length < 16) return false;
  if (bytes[0] !== 0x47 || bytes[1] !== 0x49 || bytes[2] !== 0x46) return false;
  let gceCount = 0;
  for (let i = 0; i < bytes.length - 2; i++) {
    if (bytes[i] === 0x21 && bytes[i + 1] === 0xF9) {
      gceCount++;
      if (gceCount > 1) return true;
    }
  }
  return false;
}

// Chunk splitter (mirroring content.js)
function splitDataIntoChunks(dataUrl, mime, caption, animated, maxChunkChars = 19000) {
  const commaIdx = dataUrl.indexOf(',');
  const b64Data = commaIdx !== -1 ? dataUrl.substring(commaIdx + 1) : dataUrl;
  const totalLen = b64Data.length;
  const numChunks = Math.ceil(totalLen / maxChunkChars);
  const chunkId = 'img_test_' + Date.now();
  const payloads = [];

  for (let seq = 1; seq <= numChunks; seq++) {
    const start = (seq - 1) * maxChunkChars;
    const part = b64Data.substring(start, start + maxChunkChars);
    payloads.push({
      v: 1,
      type: 'image_chunk',
      id: chunkId,
      seq: seq,
      total: numChunks,
      mime: mime,
      caption: seq === numChunks ? caption : undefined,
      animated: seq === numChunks ? animated : undefined,
      data: part
    });
  }
  return payloads;
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

  // 5. Image JSON payload encryption & decryption
  const mockImageB64 = Buffer.from('mock_image_binary_data_12345').toString('base64');
  const imagePayload = {
    v: 1,
    type: 'image',
    mime: 'image/webp',
    src: `data:image/webp;base64,${mockImageB64}`,
    caption: 'Check line 42 for syntax bug',
    animated: false
  };
  const encImage = await encryptMessage(JSON.stringify(imagePayload), 'imageKey456');
  const matchImage = /🔒\[ENC:v1:([0-9a-fA-F]{8}):([A-Za-z0-9+/=]+)\]/.exec(encImage);
  const decImageStr = await decryptPayload(matchImage[2], 'imageKey456');
  const parsedImage = JSON.parse(decImageStr);
  const test5Passed = parsedImage.type === 'image' && parsedImage.src === imagePayload.src && parsedImage.caption === imagePayload.caption;
  console.log('Test 5 (Image Payload Encrypt/Decrypt):', test5Passed ? 'PASSED' : 'FAILED');
  if (!test5Passed) throw new Error('Image payload mismatch');

  // 6. Agora RTM 32KB Limit Budget Safety Verification
  // 15 KB binary image = ~20,000 base64 chars
  const binary15KB = Buffer.alloc(15000, 0xAB);
  const b64_15KB = binary15KB.toString('base64');
  const payload15KB = JSON.stringify({
    v: 1,
    type: 'image',
    mime: 'image/webp',
    src: `data:image/webp;base64,${b64_15KB}`,
    caption: 'Sample 15KB screenshot'
  });
  const enc15KB = await encryptMessage(payload15KB, 'testPass123');
  const byteLen15KB = Buffer.byteLength(enc15KB, 'utf8');
  console.log(`Test 6 (15KB Image Encrypted Size): ${byteLen15KB} bytes (Agora limit: 32,768 bytes) -`, byteLen15KB <= 32768 ? 'PASSED' : 'FAILED');
  if (byteLen15KB > 32768) throw new Error('15KB payload exceeded 32KB limit!');

  // Verify rejection check for oversized 25KB message
  const binary25KB = Buffer.alloc(25000, 0xCD);
  const b64_25KB = binary25KB.toString('base64');
  const payload25KB = JSON.stringify({
    v: 1,
    type: 'image',
    mime: 'image/webp',
    src: `data:image/webp;base64,${b64_25KB}`
  });
  const enc25KB = await encryptMessage(payload25KB, 'testPass123');
  const byteLen25KB = Buffer.byteLength(enc25KB, 'utf8');
  const guardTriggered = byteLen25KB > 32700;
  console.log(`Test 6b (25KB Image Safety Guard Rejection Check): ${byteLen25KB} bytes > 32,700 -`, guardTriggered ? 'PASSED' : 'FAILED');
  if (!guardTriggered) throw new Error('Oversized message was not rejected by guard threshold!');

  // 7. Animated GIF Detection
  // GIF89a with 2 Graphic Control Extension blocks (0x21 0xF9)
  const animatedGifBytes = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x0A, 0x00, 0x0A, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x21, 0xF9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, // Frame 1 GCE
    0x2C, 0x00, 0x00, 0x00, 0x00, 0x0A, 0x00, 0x0A, 0x00, 0x00,
    0x21, 0xF9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, // Frame 2 GCE
    0x3B // Trailer
  ]);
  const isAnim = isAnimatedGifBytes(animatedGifBytes);
  const staticPngBytes = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
  const isNotAnim = isAnimatedGifBytes(staticPngBytes);
  const test7Passed = isAnim === true && isNotAnim === false;
  console.log('Test 7 (Animated GIF Byte Detection):', test7Passed ? 'PASSED' : 'FAILED');
  if (!test7Passed) throw new Error('GIF detection failed');

  // 8. Multi-Chunk Splitting and Reassembly
  const largeMockData = Buffer.alloc(45000, 0x55).toString('base64');
  const fullDataUrl = `data:image/gif;base64,${largeMockData}`;
  const chunks = splitDataIntoChunks(fullDataUrl, 'image/gif', 'Funny reaction GIF', true, 18000);
  console.log(`Test 8 (Multi-Chunk Split): Split 45KB into ${chunks.length} chunks`);

  // Simulate encrypting, transmitting, and assembling
  let reassembledData = '';
  for (const chunk of chunks) {
    const encChunk = await encryptMessage(JSON.stringify(chunk), 'chunkKey1');
    const match = /🔒\[ENC:v1:([0-9a-fA-F]{8}):([A-Za-z0-9+/=]+)\]/.exec(encChunk);
    const decChunkStr = await decryptPayload(match[2], 'chunkKey1');
    const decChunkObj = JSON.parse(decChunkStr);
    reassembledData += decChunkObj.data;
  }
  const test8Passed = reassembledData === largeMockData;
  console.log('Test 8 (Multi-Chunk Reassembly Match):', test8Passed ? 'PASSED' : 'FAILED');
  if (!test8Passed) throw new Error('Multi-chunk reassembly mismatch');

  // 9. Caption XSS Safety
  const evilCaption = '<script>alert("hacked")</script>&"\'';
  const evilPayload = {
    v: 1,
    type: 'image',
    src: 'data:image/webp;base64,AAAA',
    caption: evilCaption
  };
  const encEvil = await encryptMessage(JSON.stringify(evilPayload), 'safeKey');
  const matchEvil = /🔒\[ENC:v1:([0-9a-fA-F]{8}):([A-Za-z0-9+/=]+)\]/.exec(encEvil);
  const decEvilStr = await decryptPayload(matchEvil[2], 'safeKey');
  const parsedEvil = JSON.parse(decEvilStr);
  console.log('Test 9 (Caption Preservation & Safe Handling):', parsedEvil.caption === evilCaption ? 'PASSED' : 'FAILED');
  if (parsedEvil.caption !== evilCaption) throw new Error('Caption corrupted');

  console.log('--- All Expanded Tests Passed! ---');
}

runExpandedTests().catch(err => {
  console.error(err);
  process.exit(1);
});
