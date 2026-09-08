// Scaler Academy Encrypted Private Chat - Content Script
(function () {
  'use strict';

  // --- CRYPTO ENGINE ---
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function bytesToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  function base64ToBytes(base64) {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async function computeFingerprint(password) {
    if (!password) return '00000000';
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(password));
    const bytes = new Uint8Array(hash).subarray(0, 4);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

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

  async function encryptText(plaintext, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      enc.encode(plaintext)
    );

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

  // --- STORAGE ---
  const STORAGE_KEY_PROFILES = 'scaler_enc_chat_profiles_v2';
  const STORAGE_KEY_ACTIVE = 'scaler_enc_chat_active_profile_v2';

  async function storageGetAsync(key, defaultVal) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise(resolve => {
        chrome.storage.local.get([key], (res) => {
          if (res && res[key] !== undefined) resolve(res[key]);
          else resolve(defaultVal);
        });
      });
    }
    try {
      const local = localStorage.getItem(key);
      if (local !== null) return JSON.parse(local);
    } catch (e) {}
    return defaultVal;
  }

  async function storageSetAsync(key, value) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: value });
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes[STORAGE_KEY_PROFILES]) {
        profiles = changes[STORAGE_KEY_PROFILES].newValue || [];
        updateUIElements();
        reprocessAllMessages();
      }
      if (changes[STORAGE_KEY_ACTIVE]) {
        activeProfileId = changes[STORAGE_KEY_ACTIVE].newValue;
        updateUIElements();
      }
    });
  }

  // --- PROFILES STATE ---
  let profiles = [];
  let activeProfileId = null;

  async function initProfiles() {
    const saved = await storageGetAsync(STORAGE_KEY_PROFILES, null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      profiles = saved;
    } else {
      const defaultKey = 'secret123';
      const fp = await computeFingerprint(defaultKey);
      profiles = [
        {
          id: 'prof_default',
          name: 'Squad Secret',
          key: defaultKey,
          fingerprint: fp,
          color: '#10b981'
        },
        {
          id: 'prof_arin',
          name: 'Arin',
          key: 'scaler2026',
          fingerprint: await computeFingerprint('scaler2026'),
          color: '#0284c7'
        }
      ];
      saveProfiles();
    }

    activeProfileId = await storageGetAsync(STORAGE_KEY_ACTIVE, profiles[0]?.id || null);
    if (!profiles.some(p => p.id === activeProfileId)) {
      activeProfileId = profiles[0]?.id || null;
    }
  }

  function saveProfiles() {
    storageSetAsync(STORAGE_KEY_PROFILES, profiles);
    storageSetAsync(STORAGE_KEY_ACTIVE, activeProfileId);
  }

  function getActiveProfile() {
    return profiles.find(p => p.id === activeProfileId) || profiles[0] || null;
  }

  async function addProfile(name, key, color) {
    const fp = await computeFingerprint(key);
    const newProf = {
      id: 'prof_' + Date.now(),
      name: name.trim() || 'Key ' + (profiles.length + 1),
      key: key,
      fingerprint: fp,
      color: color || '#0284c7'
    };
    profiles.push(newProf);
    activeProfileId = newProf.id;
    saveProfiles();
    updateUIElements();
    reprocessAllMessages();
    return newProf;
  }

  function deleteProfile(id) {
    if (profiles.length <= 1) {
      alert('You must keep at least one key profile.');
      return;
    }
    profiles = profiles.filter(p => p.id !== id);
    if (activeProfileId === id) {
      activeProfileId = profiles[0]?.id || null;
    }
    saveProfiles();
    updateUIElements();
    reprocessAllMessages();
  }

  // --- REACT COMPATIBLE INPUT SETTER ---
  function setReactInputValue(inputElement, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(inputElement, value);
    } else {
      inputElement.value = value;
    }
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function triggerSendMessage(textarea) {
    const enterDown = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    textarea.dispatchEvent(enterDown);

    const enterUp = new KeyboardEvent('keyup', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    textarea.dispatchEvent(enterUp);

    const sendBtn = textarea.closest('.chat-input')?.querySelector('.icon-send')?.closest('a, button');
    if (sendBtn) {
      sendBtn.click();
    }
  }

  // --- FLOATING MENU (Mounted to body, completely immune to parent overflow) ---
  let floatingMenu = null;

  function getOrCreateFloatingMenu() {
    if (!floatingMenu) {
      floatingMenu = document.createElement('div');
      floatingMenu.id = 'scaler-enc-floating-menu';
      document.body.appendChild(floatingMenu);

      document.addEventListener('click', (e) => {
        if (floatingMenu && !floatingMenu.contains(e.target)) {
          floatingMenu.style.display = 'none';
        }
      });

      window.addEventListener('resize', () => {
        if (floatingMenu) floatingMenu.style.display = 'none';
      });
      window.addEventListener('scroll', () => {
        if (floatingMenu) floatingMenu.style.display = 'none';
      }, true);
    }
    return floatingMenu;
  }

  function renderDropdownMenuContent(menu) {
    menu.innerHTML = `
      <div class="scaler-enc-menu-header">
        Select Key Profile
      </div>
      ${profiles.map(p => `
        <div class="scaler-enc-menu-item ${p.id === activeProfileId ? 'active' : ''}" data-id="${p.id}">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="scaler-enc-color-dot" style="background: ${p.color}"></span>
            <span style="font-weight: 500;">${escapeHtml(p.name)}</span>
          </div>
          ${p.id === activeProfileId ? '<span style="color: #38bdf8; font-size: 11px; font-weight: bold;">✓</span>' : ''}
        </div>
      `).join('')}
      <div class="scaler-enc-menu-divider"></div>
      <div class="scaler-enc-menu-item scaler-enc-menu-btn-settings" id="scaler-enc-open-settings">
        <span>⚙️ Manage Keys...</span>
      </div>
    `;

    menu.querySelectorAll('.scaler-enc-menu-item[data-id]').forEach(item => {
      item.addEventListener('click', () => {
        activeProfileId = item.dataset.id;
        saveProfiles();
        updateUIElements();
        menu.style.display = 'none';
      });
    });

    menu.querySelector('#scaler-enc-open-settings').addEventListener('click', () => {
      menu.style.display = 'none';
      openProfilesModal();
    });
  }

  // --- INJECT CLEAN CONTROLS INTO SCALER'S CHAT BAR ---
  function injectNativeChatControls() {
    const textarea = document.querySelector('textarea.chat-input__textarea, [data-cy="meetings-sidebar-chat-input-area"]');
    if (!textarea) return;

    const chatInputField = textarea.closest('.chat-input__field') || textarea.parentElement;
    const chatControls = textarea.closest('.chat-input')?.querySelector('.chat-input__controls') || document.querySelector('.chat-input__controls');

    if (chatControls && !chatControls.querySelector('.scaler-enc-controls-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'scaler-enc-controls-wrapper';

      const activeProf = getActiveProfile();
      wrapper.innerHTML = `
        <div class="scaler-enc-pill-btn" id="scaler-enc-pill-btn" title="Click to switch key profile">
          <span class="scaler-enc-color-dot" style="background: ${activeProf ? activeProf.color : '#0284c7'}"></span>
          <span id="scaler-enc-current-name">${activeProf ? escapeHtml(activeProf.name) : 'Keys'}</span>
          <span style="font-size: 8px; opacity: 0.7;">▾</span>
        </div>
      `;

      const pill = wrapper.querySelector('#scaler-enc-pill-btn');

      pill.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const menu = getOrCreateFloatingMenu();
        if (menu.style.display === 'block') {
          menu.style.display = 'none';
          return;
        }

        renderDropdownMenuContent(menu);
        menu.style.display = 'block';

        const rect = pill.getBoundingClientRect();
        const menuHeight = menu.offsetHeight || 140;
        const rightOffset = window.innerWidth - rect.right;

        menu.style.position = 'fixed';
        menu.style.right = `${Math.max(8, rightOffset)}px`;
        menu.style.left = 'auto';

        if (rect.top > menuHeight + 10) {
          menu.style.top = `${rect.top - menuHeight - 6}px`;
        } else {
          menu.style.top = `${rect.bottom + 6}px`;
        }
      });

      const rightArea = chatControls.querySelector('.chat-input__controls-right');
      if (rightArea) {
        rightArea.appendChild(wrapper);
      } else {
        chatControls.appendChild(wrapper);
      }
    }

    if (chatInputField && !chatInputField.querySelector('.scaler-enc-lock-btn')) {
      const emojiDropdown = chatInputField.querySelector('.dropdown, .icon-emoji')?.closest('.dropdown');
      
      const lockBtn = document.createElement('a');
      lockBtn.className = 'tappable btn btn-icon btn-small scaler-enc-lock-btn';
      lockBtn.title = 'Encrypt & Send';
      lockBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      `;

      lockBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleEncryptAndSend(textarea);
      });

      if (emojiDropdown) {
        emojiDropdown.parentElement.insertBefore(lockBtn, emojiDropdown.nextSibling);
      } else {
        chatInputField.appendChild(lockBtn);
      }
    }
  }

  function updateUIElements() {
    const nameEl = document.getElementById('scaler-enc-current-name');
    const pill = document.getElementById('scaler-enc-pill-btn');
    const lockBtn = document.querySelector('.scaler-enc-lock-btn');
    const activeProf = getActiveProfile();

    if (nameEl && activeProf) {
      nameEl.textContent = activeProf.name;
    }
    if (pill && activeProf) {
      const dot = pill.querySelector('.scaler-enc-color-dot');
      if (dot) dot.style.background = activeProf.color;
    }
    if (lockBtn && activeProf) {
      lockBtn.title = `Encrypt & Send (with ${activeProf.name})`;
    }
  }

  async function handleEncryptAndSend(textarea) {
    const text = textarea.value.trim();
    if (!text) return;

    const prof = getActiveProfile();
    if (!prof) {
      alert('Please select or create a key profile first!');
      openProfilesModal();
      return;
    }

    const encrypted = await encryptText(text, prof.key);
    setReactInputValue(textarea, encrypted);

    setTimeout(() => {
      triggerSendMessage(textarea);
    }, 40);
  }

  // --- AUTOMATIC LIVE DECRYPTION (AUTO-DETECT DEFAULT & SAVED KEYS) ---
  const ENC_REGEX = /🔒\[ENC:v1:([0-9a-fA-F]{8}):([A-Za-z0-9+/=]+)\]/g;

  async function attemptAutoDecryption(token, allProfiles) {
    const match = /🔒\[ENC:v1:([0-9a-fA-F]{8}):([A-Za-z0-9+/=]+)\]/.exec(token);
    if (!match) return null;

    const [_, fingerprint, b64] = match;

    const matchedFp = allProfiles.find(p => p.fingerprint.toLowerCase() === fingerprint.toLowerCase());
    if (matchedFp) {
      try {
        const plaintext = await decryptPayload(b64, matchedFp.key);
        return { success: true, plaintext, profile: matchedFp };
      } catch (e) {}
    }

    const defaultProf = getActiveProfile();
    if (defaultProf && defaultProf !== matchedFp) {
      try {
        const plaintext = await decryptPayload(b64, defaultProf.key);
        return { success: true, plaintext, profile: defaultProf };
      } catch (e) {}
    }

    for (const p of allProfiles) {
      if (p === matchedFp || p === defaultProf) continue;
      try {
        const plaintext = await decryptPayload(b64, p.key);
        return { success: true, plaintext, profile: p };
      } catch (e) {}
    }

    return { success: false, fingerprint, b64 };
  }

  async function processChatMessageElement(msgEl) {
    if (msgEl.dataset.scalerEncProcessed === 'true') return;

    const bodyEl = msgEl.querySelector('.message-text__body, .md-renderer') || msgEl;
    const textContent = bodyEl.textContent || '';

    if (!textContent.includes('🔒[ENC:v1:')) {
      msgEl.dataset.scalerEncProcessed = 'true';
      return;
    }

    const matches = Array.from(textContent.matchAll(ENC_REGEX));
    if (matches.length === 0) {
      msgEl.dataset.scalerEncProcessed = 'true';
      return;
    }

    msgEl.dataset.scalerEncProcessed = 'true';

    for (const match of matches) {
      const fullToken = match[0];
      const result = await attemptAutoDecryption(fullToken, profiles);

      if (result && result.success) {
        renderCleanDecryptedCard(bodyEl, result.plaintext, result.profile, fullToken);
      } else if (result) {
        renderCleanLockedCard(bodyEl, result.fingerprint, result.b64, fullToken);
      }
    }
  }

  function renderCleanDecryptedCard(container, plaintext, profile, rawToken) {
    const pTags = container.querySelectorAll('p');
    pTags.forEach(p => {
      if (p.textContent.includes('🔒[ENC:v1:')) {
        p.style.display = 'none';
      }
    });

    const existing = container.querySelector('.scaler-enc-clean-msg, .scaler-enc-locked-msg');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.className = 'scaler-enc-clean-msg';

    card.innerHTML = `
      <div class="scaler-enc-badge-row">
        <span class="scaler-enc-chip" style="color: ${profile.color}; background: ${profile.color}18; border: 1px solid ${profile.color}35;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          ${escapeHtml(profile.name)}
        </span>
        <span class="scaler-enc-raw-toggle" title="Toggle raw encrypted string">raw</span>
      </div>
      <div class="scaler-enc-content">${formatPlaintext(plaintext)}</div>
      <div class="scaler-enc-raw-text" style="display: none;">${escapeHtml(rawToken)}</div>
    `;

    const rawToggle = card.querySelector('.scaler-enc-raw-toggle');
    const rawBox = card.querySelector('.scaler-enc-raw-text');
    rawToggle.addEventListener('click', () => {
      const isHidden = rawBox.style.display === 'none';
      rawBox.style.display = isHidden ? 'block' : 'none';
      rawToggle.textContent = isHidden ? 'hide raw' : 'raw';
    });

    container.appendChild(card);
  }

  function renderCleanLockedCard(container, fingerprint, b64, rawToken) {
    const pTags = container.querySelectorAll('p');
    pTags.forEach(p => {
      if (p.textContent.includes('🔒[ENC:v1:')) {
        p.style.display = 'none';
      }
    });

    const existing = container.querySelector('.scaler-enc-clean-msg, .scaler-enc-locked-msg');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.style.margin = '2px 0';

    wrapper.innerHTML = `
      <div class="scaler-enc-locked-msg">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Encrypted (#${escapeHtml(fingerprint)})</span>
        <button class="scaler-enc-unlock-link">Unlock</button>
      </div>
      <div class="scaler-enc-inline-unlock" style="display: none;">
        <input type="password" class="scaler-enc-inline-input" placeholder="Enter password...">
        <button class="scaler-enc-unlock-link submit-key">Decrypt</button>
      </div>
    `;

    const unlockBtn = wrapper.querySelector('.scaler-enc-unlock-link');
    const unlockForm = wrapper.querySelector('.scaler-enc-inline-unlock');
    const input = wrapper.querySelector('.scaler-enc-inline-input');
    const submitBtn = wrapper.querySelector('.submit-key');

    unlockBtn.addEventListener('click', () => {
      unlockForm.style.display = unlockForm.style.display === 'none' ? 'flex' : 'none';
      if (unlockForm.style.display === 'flex') input.focus();
    });

    const performUnlock = async () => {
      const pwd = input.value.trim();
      if (!pwd) return;
      try {
        const text = await decryptPayload(b64, pwd);
        const save = confirm(`Decrypted: "${text.substring(0, 30)}..."\n\nSave this key to your profiles?`);
        let prof = {
          id: 'temp_' + Date.now(),
          name: `Key #${fingerprint}`,
          key: pwd,
          fingerprint: fingerprint,
          color: '#f59e0b'
        };
        if (save) {
          const name = prompt('Enter a name for this key profile:', `Key #${fingerprint}`);
          prof = await addProfile(name || `Key #${fingerprint}`, pwd, '#f59e0b');
        }
        wrapper.remove();
        renderCleanDecryptedCard(container, text, prof, rawToken);
      } catch (e) {
        alert('❌ Decryption failed: Incorrect password.');
      }
    };

    submitBtn.addEventListener('click', performUnlock);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performUnlock();
    });

    container.appendChild(wrapper);
  }

  function reprocessAllMessages() {
    const messages = document.querySelectorAll('[data-cy="meetings-chat-message"], .chat-message');
    messages.forEach(msg => {
      delete msg.dataset.scalerEncProcessed;
      processChatMessageElement(msg);
    });
  }

  function setupLiveObserver() {
    const observer = new MutationObserver(() => {
      injectNativeChatControls();
      const messages = document.querySelectorAll('[data-cy="meetings-chat-message"], .chat-message');
      messages.forEach(processChatMessageElement);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    injectNativeChatControls();
    const messages = document.querySelectorAll('[data-cy="meetings-chat-message"], .chat-message');
    messages.forEach(processChatMessageElement);
  }

  // --- KEY PROFILES MODAL (With Key Reveal Toggle) ---
  function openProfilesModal() {
    if (document.getElementById('scaler-enc-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'scaler-enc-modal-overlay';
    overlay.id = 'scaler-enc-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'scaler-enc-modal';

    let selectedColor = '#0284c7';
    const PRESET_COLORS = ['#0284c7', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#ef4444'];

    function renderModalContent() {
      modal.innerHTML = `
        <div class="scaler-enc-modal-header">
          <div class="scaler-enc-modal-title" style="display:flex; align-items:center; gap:8px;">
            <svg width="20" height="20" viewBox="0 0 512 512" fill="none" style="flex-shrink:0;">
              <defs>
                <linearGradient id="mShield" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#0284c7"/>
                  <stop offset="50%" stop-color="#2563eb"/>
                  <stop offset="100%" stop-color="#7c3aed"/>
                </linearGradient>
                <linearGradient id="mLock" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ffffff"/>
                  <stop offset="100%" stop-color="#f1f5f9"/>
                </linearGradient>
                <linearGradient id="mCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#38bdf8"/>
                  <stop offset="100%" stop-color="#0284c7"/>
                </linearGradient>
              </defs>
              <path d="M 256,44 C 362,44 428,96 432,188 C 436,296 360,392 256,456 C 204,424 162,384 136,344 L 96,368 C 84,375 70,366 73,352 L 84,304 C 74,272 72,232 76,188 C 80,96 150,44 256,44 Z" fill="url(#mShield)"/>
              <path d="M 200,210 L 200,166 C 200,135 225,110 256,110 C 287,110 312,135 312,166 L 312,210" fill="none" stroke="#e2e8f0" stroke-width="26" stroke-linecap="round"/>
              <rect x="172" y="196" width="168" height="136" rx="28" ry="28" fill="url(#mLock)"/>
              <circle cx="256" cy="248" r="18" fill="url(#mCyan)"/>
              <path d="M 248,252 L 264,252 L 268,284 C 268,288 264,292 260,292 L 252,292 C 248,292 244,288 244,284 Z" fill="url(#mCyan)"/>
            </svg>
            <span>Key Profiles</span>
          </div>
          <button class="scaler-enc-modal-close" id="scaler-enc-modal-close-btn">&times;</button>
        </div>
        <div class="scaler-enc-modal-body">
          <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">Saved Profiles (${profiles.length})</div>
          <div style="max-height: 200px; overflow-y: auto; margin-bottom: 12px;">
            ${profiles.map(p => {
              const isActive = p.id === activeProfileId;
              return `
                <div class="scaler-enc-modal-card ${isActive ? 'active' : ''}" data-id="${p.id}">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span class="scaler-enc-color-dot" style="background: ${p.color}; width: 8px; height: 8px;"></span>
                      <strong style="font-size: 12px; color: #f8fafc;">${escapeHtml(p.name)}</strong>
                      <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">#${p.fingerprint}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px;">
                      ${isActive ? '<span style="font-size: 10px; color: #38bdf8; font-weight: 700;">Active</span>' : `<button class="btn-use-modal" data-id="${p.id}" style="background: #334155; color: #fff; border: none; padding: 2px 6px; border-radius: 3px; font-size: 10px; cursor: pointer;">Use</button>`}
                      <button class="btn-del-modal" data-id="${p.id}" style="background: transparent; border: none; color: #ef4444; font-size: 11px; cursor: pointer;" title="Delete">✕</button>
                    </div>
                  </div>
                  <div class="scaler-enc-key-box">
                    <span style="color: #94a3b8; font-size: 10px;">Key:</span>
                    <span class="modal-key-display" id="modal-key-${p.id}" data-masked="true" style="font-family: monospace; color: #cbd5e1; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">••••••••••</span>
                    <button class="modal-toggle-key" data-id="${p.id}" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 12px;" title="Show / Hide Key">👁️</button>
                    <button class="modal-copy-key" data-id="${p.id}" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 12px;" title="Copy Key">📋</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">Add New Profile</div>
          <input type="text" id="scaler-enc-new-name" class="scaler-enc-input" style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #fff; padding: 6px 9px; font-size: 12px; margin-bottom: 6px; box-sizing: border-box;" placeholder="Profile Name (e.g. Arin, Squad)...">
          <input type="password" id="scaler-enc-new-key" class="scaler-enc-input" style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #fff; padding: 6px 9px; font-size: 12px; margin-bottom: 8px; box-sizing: border-box;" placeholder="Secret Key / Passphrase...">
          
          <div style="display: flex; gap: 6px; margin-bottom: 10px;">
            ${PRESET_COLORS.map(c => `
              <div class="color-dot-opt ${c === selectedColor ? 'selected' : ''}" style="width: 18px; height: 18px; border-radius: 50%; background: ${c}; cursor: pointer; border: 2px solid ${c === selectedColor ? '#fff' : 'transparent'};" data-color="${c}"></div>
            `).join('')}
          </div>
          <button id="scaler-enc-add-btn" style="width: 100%; padding: 7px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">➕ Add Profile</button>

          <hr style="border: none; border-top: 1px solid #334155; margin: 12px 0;">

          <div style="display: flex; gap: 6px;">
            <button id="scaler-enc-export-btn" style="flex: 1; background: #1e293b; border: 1px solid #334155; color: #cbd5e1; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">📋 Export</button>
            <button id="scaler-enc-import-btn" style="flex: 1; background: #1e293b; border: 1px solid #334155; color: #cbd5e1; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">📥 Import</button>
          </div>
        </div>
      `;

      modal.querySelector('#scaler-enc-modal-close-btn').addEventListener('click', closeModal);

      modal.querySelectorAll('.btn-use-modal').forEach(b => {
        b.addEventListener('click', () => {
          activeProfileId = b.dataset.id;
          saveProfiles();
          updateUIElements();
          renderModalContent();
        });
      });

      modal.querySelectorAll('.btn-del-modal').forEach(b => {
        b.addEventListener('click', () => {
          deleteProfile(b.dataset.id);
          renderModalContent();
        });
      });

      modal.querySelectorAll('.modal-toggle-key').forEach(b => {
        b.addEventListener('click', () => {
          const prof = profiles.find(p => p.id === b.dataset.id);
          if (!prof) return;
          const display = document.getElementById(`modal-key-${prof.id}`);
          const isMasked = display.dataset.masked === 'true';
          if (isMasked) {
            display.textContent = prof.key;
            display.dataset.masked = 'false';
            b.textContent = '🙈';
          } else {
            display.textContent = '••••••••••';
            display.dataset.masked = 'true';
            b.textContent = '👁️';
          }
        });
      });

      modal.querySelectorAll('.modal-copy-key').forEach(b => {
        b.addEventListener('click', () => {
          const prof = profiles.find(p => p.id === b.dataset.id);
          if (!prof) return;
          navigator.clipboard.writeText(prof.key).then(() => {
            b.textContent = '✅';
            setTimeout(() => { b.textContent = '📋'; }, 1200);
          });
        });
      });

      modal.querySelectorAll('.color-dot-opt').forEach(opt => {
        opt.addEventListener('click', () => {
          selectedColor = opt.dataset.color;
          modal.querySelectorAll('.color-dot-opt').forEach(o => o.style.borderColor = 'transparent');
          opt.style.borderColor = '#fff';
        });
      });

      modal.querySelector('#scaler-enc-add-btn').addEventListener('click', async () => {
        const name = modal.querySelector('#scaler-enc-new-name').value.trim();
        const key = modal.querySelector('#scaler-enc-new-key').value.trim();
        if (!key) {
          alert('Please enter a secret key!');
          return;
        }
        await addProfile(name, key, selectedColor);
        renderModalContent();
      });

      modal.querySelector('#scaler-enc-export-btn').addEventListener('click', () => {
        const json = JSON.stringify(profiles.map(p => ({ name: p.name, key: p.key, color: p.color })), null, 2);
        navigator.clipboard.writeText(json).then(() => {
          alert('✅ Profiles copied to clipboard!');
        }).catch(() => {
          prompt('Copy profiles JSON:', json);
        });
      });

      modal.querySelector('#scaler-enc-import-btn').addEventListener('click', async () => {
        const input = prompt('Paste key profiles JSON:');
        if (!input) return;
        try {
          const imported = JSON.parse(input);
          if (Array.isArray(imported)) {
            for (const item of imported) {
              if (item.key) {
                await addProfile(item.name || 'Shared Key', item.key, item.color || '#0284c7');
              }
            }
            alert(`✅ Imported ${imported.length} profile(s)!`);
            renderModalContent();
          }
        } catch (e) {
          alert('❌ Invalid JSON.');
        }
      });
    }

    function closeModal() {
      overlay.remove();
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    renderModalContent();
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
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

  function formatPlaintext(str) {
    const escaped = escapeHtml(str);
    return escaped.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline;">$1</a>');
  }

  async function init() {
    await initProfiles();
    setupLiveObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
