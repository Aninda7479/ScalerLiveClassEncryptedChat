// Background Service Worker for Scaler Academy Encrypted Private Chat
// Periodically checks GitHub Releases (with fallback to raw main branch) for new versions

const GITHUB_REPO = 'Aninda7479/ScalerLiveClassEncryptedChat';
const GITHUB_RELEASES_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const GITHUB_RAW_MANIFEST_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/chrome-extension/manifest.json`;
const ALARM_NAME = 'scaler_chat_check_update';

function parseVersion(v) {
  if (!v) return [0];
  return String(v).replace(/^v/, '').split('.').map(x => parseInt(x, 10) || 0);
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

async function applyUpdateFound(version, updateInfo) {
  await chrome.storage.local.set({ updateAvailable: updateInfo });
  chrome.action.setBadgeText({ text: 'NEW' });
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  chrome.action.setTitle({
    title: `Scaler Encrypted Chat: Update v${version} available!`
  });
}

async function applyUpToDate(currentVersion) {
  await chrome.storage.local.remove('updateAvailable');
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setTitle({
    title: `Scaler Encrypted Chat (v${currentVersion})`
  });
  await chrome.storage.local.set({ lastUpdateCheck: Date.now() });
}

async function checkForUpdates(manual = false) {
  const currentVersion = chrome.runtime.getManifest().version;

  try {
    // 1. Check official GitHub Releases
    const res = await fetch(GITHUB_RELEASES_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.ok) {
      const release = await res.json();
      const remoteTag = release.tag_name || release.name || '';

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

        await applyUpdateFound(cleanRemoteVersion, updateInfo);
        return { success: true, hasUpdate: true, updateInfo };
      }
    } else if (res.status === 404) {
      // 404 indicates no official release has been published yet on GitHub.
      // Graceful fallback: check the manifest.json directly from the main branch
      try {
        const rawRes = await fetch(GITHUB_RAW_MANIFEST_URL);
        if (rawRes.ok) {
          const rawManifest = await rawRes.json();
          const remoteVersion = rawManifest.version;

          if (isNewerVersion(remoteVersion, currentVersion)) {
            const updateInfo = {
              hasUpdate: true,
              version: remoteVersion,
              rawTag: `v${remoteVersion}`,
              releaseUrl: `https://github.com/${GITHUB_REPO}`,
              downloadZipUrl: `https://github.com/${GITHUB_REPO}/archive/refs/heads/main.zip`,
              notes: 'New version available on GitHub.',
              publishedAt: new Date().toISOString(),
              checkedAt: Date.now()
            };

            await applyUpdateFound(remoteVersion, updateInfo);
            return { success: true, hasUpdate: true, updateInfo };
          }
        }
      } catch (rawErr) {
        // Ignore fallback failure
      }
    } else {
      console.warn(`[Scaler Chat Updater] GitHub API returned status ${res.status}`);
      return { success: false, error: `HTTP ${res.status}` };
    }

    // Up to date
    await applyUpToDate(currentVersion);
    return { success: true, hasUpdate: false, version: currentVersion };

  } catch (err) {
    console.error('[Scaler Chat Updater] Check error:', err);
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
