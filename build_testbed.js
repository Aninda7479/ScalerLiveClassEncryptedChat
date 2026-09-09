const fs = require('fs');

let html = fs.readFileSync('page.html', 'utf8');
const scriptContent = fs.readFileSync('scaler-encrypted-chat.user.js', 'utf8');

const simulationScript = `
<style>
  #test-simulation-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 42px;
    background: #0f172a;
    border-bottom: 2px solid #38bdf8;
    z-index: 100000;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    color: #f8fafc;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
  }
  .sim-btn {
    background: #1e293b;
    color: #38bdf8;
    border: 1px solid #38bdf8;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .sim-btn:hover {
    background: #38bdf8;
    color: #0f172a;
  }
  body {
    padding-top: 42px !important;
  }
</style>

<div id="test-simulation-bar">
  <div style="display:flex; align-items:center; gap:8px;">
    <img src="logo.svg" width="20" height="20" alt="Logo" style="display:block;">
    <strong>Scaler Encrypted Chat Testbed</strong>
  </div>
  <span>|</span>
  <button class="sim-btn" id="sim-sst-btn">📥 Simulate 'SST' Text</button>
  <button class="sim-btn" id="sim-unknown-btn">📥 Unknown Key Text</button>
  <button class="sim-btn" id="sim-image-btn" style="background:#0369a1; border-color:#38bdf8; color:#fff;">📸 Simulate Encrypted Image</button>
  <button class="sim-btn" id="sim-gif-btn" style="background:#831843; border-color:#ec4899; color:#fff;">🎞️ Simulate Encrypted GIF</button>
  <span style="margin-left: auto; color: #94a3b8;">Paste/Drop image into chat, or click 📷 attachment!</span>
</div>

<script>
// Mock message appender for testing sending in offline page
(function() {
  function appendMockMessage(author, text, isMine) {
    const container = document.querySelector('.chat-window__messages-container');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message';
    msgDiv.setAttribute('data-cy', 'meetings-chat-message');
    msgDiv.innerHTML = [
      '<div class="message-text ' + (isMine ? 'message-text--mine' : 'message-text--others') + '">',
        '<div class="message-text__header">',
          '<div class="message-text__from">',
            '<div class="message-text__availability message-text__availability--online"></div>',
            '<span class="message-text__author ' + (isMine ? '' : 'cursor') + '">' + author + '</span>',
          '</div>',
          '<div class="message-text__to message-text__to--public">To: Everyone</div>',
          '<div class="message-text__date">Just now</div>',
        '</div>',
        '<div class="message-text__body">',
          '<div class="md-renderer">',
            '<p>' + text + '</p>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }

  // Intercept sending for the offline testbed
  window.addEventListener('DOMContentLoaded', () => {
    const textarea = document.querySelector('textarea.chat-input__textarea');
    if (textarea) {
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          const val = textarea.value.trim();
          if (val) {
            appendMockMessage('You', val, true);
            textarea.value = '';
          }
        }
      });
    }

    // Connect test simulation buttons
    document.getElementById('sim-sst-btn').addEventListener('click', async () => {
      // SST key: 'SST2030@Aninda'
      const enc = await window.scalerEncryptTextTest('Hey buddy, answer for Q4 is O(log N)!', 'SST2030@Aninda');
      appendMockMessage('Rahul Sharma (SST)', enc, false);
    });

    document.getElementById('sim-unknown-btn').addEventListener('click', async () => {
      // Unknown key: 'strangerKey777'
      const enc = await window.scalerEncryptTextTest('This is a confidential note between strangers', 'strangerKey777');
      appendMockMessage('Mystery Student', enc, false);
    });

    // Synthetic SVG canvas drawing converted to WebP data URL
    function createSyntheticDataUrl(text, color, bgColor) {
      const c = document.createElement('canvas');
      c.width = 400;
      c.height = 240;
      const ctx = c.getContext('2d');
      ctx.fillStyle = bgColor || '#0f172a';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.strokeStyle = color || '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 380, 220);
      ctx.fillStyle = color || '#38bdf8';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, 200, 110);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Encrypted Scaler Image Demo', 200, 150);
      return c.toDataURL('image/png');
    }

    document.getElementById('sim-image-btn').addEventListener('click', async () => {
      const dataUrl = createSyntheticDataUrl('Binary Search Tree: O(log N)', '#38bdf8', '#0f172a');
      const payload = JSON.stringify({
        v: 1,
        type: 'image',
        mime: 'image/png',
        src: dataUrl,
        caption: 'Look at the BST time complexity diagram!',
        animated: false
      });
      const enc = await window.scalerEncryptTextTest(payload, 'SST2030@Aninda');
      appendMockMessage('Aninda (SST)', enc, false);
    });

    document.getElementById('sim-gif-btn').addEventListener('click', async () => {
      // Animated 10x10 2-frame minimal GIF in base64
      const gifB64 = 'R0lGODlhCgAKAIABAP8AAP///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQBAAABACwAAAAACgAKAAACDIyPacHtvp5kE1o8BQA7ACH5BAEAAAEALAAAAAAKAAoAAAIKjI+py+0PWoQpAQA7';
      const fullData = 'data:image/gif;base64,' + gifB64;
      // Split into 2 chunks
      const half = Math.ceil(gifB64.length / 2);
      const chunkId = 'test_gif_' + Date.now();

      const chunk1 = JSON.stringify({
        v: 1,
        type: 'image_chunk',
        id: chunkId,
        seq: 1,
        total: 2,
        mime: 'image/gif',
        data: gifB64.substring(0, half)
      });

      const chunk2 = JSON.stringify({
        v: 1,
        type: 'image_chunk',
        id: chunkId,
        seq: 2,
        total: 2,
        mime: 'image/gif',
        caption: 'Animated celebration GIF reaction! 🎉',
        animated: true,
        data: gifB64.substring(half)
      });

      const enc1 = await window.scalerEncryptTextTest(chunk1, 'SST2030@Aninda');
      const enc2 = await window.scalerEncryptTextTest(chunk2, 'SST2030@Aninda');

      appendMockMessage('Rohit (SST)', enc1, false);
      setTimeout(() => {
        appendMockMessage('Rohit (SST)', enc2, false);
      }, 400);
    });
  });
})();
</script>
`;

// Expose a test helper in the user script
const modifiedScript = scriptContent + '\nwindow.scalerEncryptTextTest = encryptText;\n';

// Insert simulation scripts right before </body>
html = html.replace('</body>', simulationScript + '\n<script>\n' + modifiedScript + '\n</script>\n</body>');

fs.writeFileSync('test-scaler-chat.html', html, 'utf8');
console.log('Created test-scaler-chat.html successfully!');
