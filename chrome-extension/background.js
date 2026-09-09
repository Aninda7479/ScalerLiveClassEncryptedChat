// Background Service Worker for Scaler Academy Encrypted Private Chat
// Periodically checks GitHub Releases for new extension versions

const GITHUB_REPO = 'Aninda7479/ScalerLiveClassEncryptedChat';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const ALARM_NAME = 'scaler_chat_check_update';

function parseVersion(v) {
  if (!v) return [0];
  return v.replace(/^v/, '').split('.').map(x => parseInt(x, 10) || 0);
}

function isNewerVersion(remote, current) {
  const r = parseVersion(remote);
  const c = parseVersion(current);
  const maxLen = Math.max(r.length, c.length);
  for (let i = 0; i < maxLen; i++) {
    const rVal = r[i] || 0;
    const cVal = c[i] || 0;
    if (rVal > cVal) return true;
    if (rVal < cVal) return false;
  }
  return false;
}

async function checkForUpdates(manual = false) {
  try {
    const res = await fetch(GITHUB_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      console.warn(`[Scaler Chat Updater] GitHub release check returned status ${res.status}`);
      return { success: false, error: `HTTP ${res.status}` };
    }

    const release = await res.json();
    const remoteTag = release.tag_name || release.name || '';
    const currentVersion = chrome.runtime.getManifest().version;

    if (isNewerVersion(remoteTag, currentVersion)) {
      const cleanRemoteVersion = remoteTag.replace(/^v/, '');

      let zipAsset = null;
      if (Array.isArray(release.assets)) {
        zipAsset = release.assets.find(a => a.name && a.name.endsWith('.zip'));
      }
      const downloadZipUrl = zipAsset ? zipAsset.browser_download_url : release.html_url;

      const updateInfo = {
        hasUpdate: true,
        version: cleanRemoteVersion,
        rawTag: remoteTag,
        releaseUrl: release.html_url,
        downloadZipUrl: downloadZipUrl,
        notes: release.body || '',
        publishedAt: release.published_at || new Date().toISOString(),
        checkedAt: Date.now()
      };

      await chrome.storage.local.set({ updateAvailable: updateInfo });

      // Highlight extension icon badge
      chrome.action.setBadgeText({ text: 'NEW' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
      chrome.action.setTitle({
        title: `Scaler Encrypted Chat: Update v${cleanRemoteVersion} available!`
      });

      return { success: true, hasUpdate: true, updateInfo };
    } else {
      // Up to date
      await chrome.storage.local.remove('updateAvailable');
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setTitle({
        title: `Scaler Encrypted Chat (v${currentVersion})`
      });
      await chrome.storage.local.set({ lastUpdateCheck: Date.now() });
      return { success: true, hasUpdate: false, version: currentVersion };
    }
  } catch (err) {
    console.error('[Scaler Chat Updater] Failed to check for updates:', err);
    return { success: false, error: err.message };
  }
}

// Alarm & Startup setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: 1,      // Check 1 min after install
    periodInMinutes: 720    // Re-check every 12 hours
  });
  checkForUpdates(false);
});

chrome.runtime.onStartup.addListener(() => {
  checkForUpdates(false);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkForUpdates(false);
  }
});

// Messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'CHECK_FOR_UPDATES') {
    checkForUpdates(true).then(sendResponse);
    return true; // Async reply
  }
  if (message && message.type === 'DISMISS_UPDATE_BADGE') {
    chrome.action.setBadgeText({ text: '' });
    sendResponse({ success: true });
  }
});
