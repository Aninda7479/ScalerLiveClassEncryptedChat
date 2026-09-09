// Popup Script for Chrome Extension with Key Reveal and Adaptive UI
const STORAGE_KEY_PROFILES = 'scaler_enc_chat_profiles_v2';
const STORAGE_KEY_ACTIVE = 'scaler_enc_chat_active_profile_v2';

const PRESET_COLORS = ['#0284c7', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#ef4444'];
let selectedColor = '#0284c7';
let profiles = [];
let activeProfileId = null;

const enc = new TextEncoder();
async function computeFingerprint(password) {
  if (!password) return '00000000';
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(password));
  const bytes = new Uint8Array(hash).subarray(0, 4);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadData() {
  chrome.storage.local.get([STORAGE_KEY_PROFILES, STORAGE_KEY_ACTIVE], (res) => {
    profiles = res[STORAGE_KEY_PROFILES] || [
      { id: 'prof_sst', name: 'SST', key: 'SST2030@Aninda', fingerprint: '5c3ffcbe', color: '#0284c7' }
    ];
    activeProfileId = res[STORAGE_KEY_ACTIVE] || profiles[0].id;
    render();
  });
}

function saveData() {
  chrome.storage.local.set({
    [STORAGE_KEY_PROFILES]: profiles,
    [STORAGE_KEY_ACTIVE]: activeProfileId
  });
  render();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function render() {
  const list = document.getElementById('profile-list');
  list.innerHTML = profiles.map(p => {
    const isActive = p.id === activeProfileId;
    return `
      <div class="profile-card ${isActive ? 'active' : ''}">
        <div class="card-top">
          <div class="card-title-group">
            <span class="color-dot" style="background: ${p.color};"></span>
            <span class="profile-name">${escapeHtml(p.name)}</span>
            <span class="fp-badge">#${p.fingerprint}</span>
          </div>
          <div class="card-actions">
            ${isActive ? '<span class="active-tag">Active</span>' : `<button class="btn-sm btn-use" data-id="${p.id}">Use</button>`}
            <button class="btn-sm btn-del" data-id="${p.id}" title="Delete Profile">✕</button>
          </div>
        </div>
        <div class="key-row">
          <span class="key-label">Key:</span>
          <span class="key-display" id="key-display-${p.id}" data-masked="true">••••••••••</span>
          <button class="icon-btn btn-toggle-key" data-id="${p.id}" title="Show / Hide Key">👁️</button>
          <button class="icon-btn btn-copy-key" data-id="${p.id}" title="Copy Key">📋</button>
        </div>
      </div>
    `;
  }).join('');

  // Switch Active
  list.querySelectorAll('.btn-use').forEach(b => {
    b.addEventListener('click', () => {
      activeProfileId = b.dataset.id;
      saveData();
    });
  });

  // Delete
  list.querySelectorAll('.btn-del').forEach(b => {
    b.addEventListener('click', () => {
      if (profiles.length <= 1) {
        alert('You must keep at least one profile.');
        return;
      }
      profiles = profiles.filter(p => p.id !== b.dataset.id);
      if (activeProfileId === b.dataset.id) activeProfileId = profiles[0]?.id || null;
      saveData();
    });
  });

  // Toggle Key Visibility (Show / Hide)
  list.querySelectorAll('.btn-toggle-key').forEach(b => {
    b.addEventListener('click', () => {
      const prof = profiles.find(p => p.id === b.dataset.id);
      if (!prof) return;
      const display = document.getElementById(`key-display-${prof.id}`);
      const isMasked = display.dataset.masked === 'true';
      if (isMasked) {
        display.textContent = prof.key;
        display.dataset.masked = 'false';
        b.textContent = '🙈';
        b.title = 'Hide Key';
      } else {
        display.textContent = '••••••••••';
        display.dataset.masked = 'true';
        b.textContent = '👁️';
        b.title = 'Show Key';
      }
    });
  });

  // Copy Key
  list.querySelectorAll('.btn-copy-key').forEach(b => {
    b.addEventListener('click', () => {
      const prof = profiles.find(p => p.id === b.dataset.id);
      if (!prof) return;
      navigator.clipboard.writeText(prof.key).then(() => {
        b.textContent = '✅';
        setTimeout(() => { b.textContent = '📋'; }, 1200);
      });
    });
  });

  // Color Pickers
  const picker = document.getElementById('color-pickers');
  picker.innerHTML = PRESET_COLORS.map(c => `
    <div class="color-opt ${c === selectedColor ? 'selected' : ''}" style="background: ${c};" data-color="${c}"></div>
  `).join('');

  picker.querySelectorAll('.color-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      selectedColor = opt.dataset.color;
      render();
    });
  });
}

document.getElementById('add-btn').addEventListener('click', async () => {
  const nameInput = document.getElementById('new-name');
  const keyInput = document.getElementById('new-key');
  const name = nameInput.value.trim();
  const key = keyInput.value.trim();
  if (!key) {
    alert('Please enter a secret key / password.');
    return;
  }

  const fp = await computeFingerprint(key);
  const newProf = {
    id: 'prof_' + Date.now(),
    name: name || 'Key ' + (profiles.length + 1),
    key: key,
    fingerprint: fp,
    color: selectedColor
  };
  profiles.push(newProf);
  activeProfileId = newProf.id;
  nameInput.value = '';
  keyInput.value = '';
  saveData();
});

document.getElementById('export-btn').addEventListener('click', () => {
  const json = JSON.stringify(profiles.map(p => ({ name: p.name, key: p.key, color: p.color })), null, 2);
  navigator.clipboard.writeText(json).then(() => {
    alert('✅ Key profiles copied to clipboard!');
  }).catch(() => {
    prompt('Copy profiles JSON:', json);
  });
});

document.getElementById('import-btn').addEventListener('click', async () => {
  const input = prompt('Paste key profiles JSON:');
  if (!input) return;
  try {
    const imported = JSON.parse(input);
    if (Array.isArray(imported)) {
      for (const item of imported) {
        if (item.key) {
          const fp = await computeFingerprint(item.key);
          profiles.push({
            id: 'prof_' + Date.now() + Math.random().toString(36).slice(2, 6),
            name: item.name || 'Shared Key',
            key: item.key,
            fingerprint: fp,
            color: item.color || '#0284c7'
          });
        }
      }
      saveData();
      alert(`✅ Imported ${imported.length} profile(s)!`);
    }
  } catch (e) {
    alert('❌ Invalid JSON format.');
  }
});

// --- UPDATE CHECKER LOGIC ---
function initUpdateChecker() {
  // Sync version badge with manifest
  try {
    const manifest = chrome.runtime.getManifest();
    const verBadge = document.getElementById('version-badge');
    if (verBadge && manifest && manifest.version) {
      verBadge.textContent = `v${manifest.version}`;
    }
  } catch (e) {}

  checkStoredUpdate();

  // Dismiss Banner
  const dismissBtn = document.getElementById('update-dismiss-btn');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      const banner = document.getElementById('update-banner');
      if (banner) banner.style.display = 'none';
      try {
        chrome.runtime.sendMessage({ type: 'DISMISS_UPDATE_BADGE' });
      } catch (e) {}
    });
  }

  // Manual Check Button
  const checkBtn = document.getElementById('check-update-btn');
  const statusEl = document.getElementById('update-check-status');

  if (checkBtn) {
    checkBtn.addEventListener('click', () => {
      if (statusEl) {
        statusEl.textContent = 'Checking GitHub...';
        statusEl.style.color = '#38bdf8';
      }
      try {
        chrome.runtime.sendMessage({ type: 'CHECK_FOR_UPDATES' }, (response) => {
          if (chrome.runtime.lastError || !response) {
            if (statusEl) {
              statusEl.textContent = 'Check failed. Try again later.';
              statusEl.style.color = '#f87171';
            }
            return;
          }
          if (response.success) {
            if (response.hasUpdate) {
              if (statusEl) {
                statusEl.textContent = `New version v${response.updateInfo.version} found!`;
                statusEl.style.color = '#38bdf8';
              }
              checkStoredUpdate();
            } else {
              if (statusEl) {
                statusEl.textContent = `You have the latest version (v${response.version}).`;
                statusEl.style.color = '#10b981';
              }
              checkStoredUpdate();
            }
          } else {
            if (statusEl) {
              statusEl.textContent = response.error ? `Check error: ${response.error}` : 'Could not reach GitHub.';
              statusEl.style.color = '#f87171';
            }
          }
          setTimeout(() => {
            if (statusEl) statusEl.textContent = '';
          }, 3500);
        });
      } catch (err) {
        if (statusEl) statusEl.textContent = 'Error checking update.';
      }
    });
  }
}

function checkStoredUpdate() {
  try {
    chrome.storage.local.get(['updateAvailable'], (res) => {
      const update = res ? res.updateAvailable : null;
      const banner = document.getElementById('update-banner');
      if (!banner) return;

      if (update && update.hasUpdate) {
        const titleEl = document.getElementById('update-version-label');
        if (titleEl) titleEl.textContent = `Update v${update.version} Available!`;

        const descEl = document.getElementById('update-desc');
        if (descEl) {
          if (update.notes && update.notes.trim()) {
            const cleanNotes = update.notes.replace(/[#*`_]/g, '').trim();
            descEl.textContent = cleanNotes.length > 80 ? cleanNotes.slice(0, 80) + '...' : cleanNotes;
          } else {
            descEl.textContent = 'A newer release is ready on GitHub.';
          }
        }

        const downloadBtn = document.getElementById('update-download-btn');
        if (downloadBtn) {
          downloadBtn.href = update.downloadZipUrl || update.releaseUrl;
        }

        const notesBtn = document.getElementById('update-notes-btn');
        if (notesBtn) {
          notesBtn.href = update.releaseUrl;
        }

        banner.style.display = 'block';
      } else {
        banner.style.display = 'none';
      }
    });
  } catch (e) {}
}

loadData();
initUpdateChecker();
