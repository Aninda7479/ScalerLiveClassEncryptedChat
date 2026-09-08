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
  <button class="sim-btn" id="sim-sst-btn">📥 Simulate 'SST' Message</button>
  <button class="sim-btn" id="sim-unknown-btn">📥 Simulate 'Unknown Key' Message</button>
  <span style="margin-left: auto; color: #94a3b8;">Type in chat box & click '🔒 Encrypt & Send'</span>
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
