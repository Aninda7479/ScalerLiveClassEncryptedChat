<p align="center">
  <img src="logo.svg" width="120" height="120" alt="Scaler Encrypted Chat Logo">
</p>

# Scaler Academy - Encrypted Private Chat

> **Private Chats in a Public Place.** End-to-End client-side encrypted messaging for Scaler Academy live classrooms (`https://www.scaler.com/academy/mentee-dashboard/class/*`).

---

## ✨ Features

- **Multi-Key Profile Management**: Create unlimited password profiles (e.g. *SST*, *Friend Bob*, *DSA Study Group*), assign custom color badges, and switch between them in 1-click.
- **Inspect & Copy Passphrases**: Toggle secret visibility (`👁️`) to verify passwords and copy them (`📋`) in 1 click to share with study partners.
- **One-Click Encryption & Sending**: Dedicated **"🔒 Encrypt & Send"** button placed seamlessly beside Scaler's emoji picker. Fully integrates with Scaler's React input state.
- **Clean, Native & Adaptive Design**: Lightweight pill selector with pinned right alignment, zero vertical layout shifting, and high-contrast styling resistant to classroom CSS themes.
- **Real-Time Live Decryption**: Incoming messages are instantly scanned. If the message matches any of your key profiles, it automatically unlocks and displays a handsome badge with the profile name and color.
- **On-the-Fly Unlocking for Unknown Keys**: If someone sends an encrypted message with a key you haven't saved yet, a locked banner is displayed with an inline **"Unlock"** form allowing you to enter the password on the spot.
- **Zero Information Leakage**: 
  - AES-256-GCM authenticated encryption.
  - PBKDF2 with SHA-256 & 50,000 iterations.
  - 16-byte random salt + 12-byte random IV per message.
  - 4-byte key fingerprint hash for instant $O(1)$ profile matching without trial-and-error lag.
- **Classmate Key Sharing**: Export profiles to JSON to share secret keys with trusted friends, and Import shared profiles in seconds.

---

## 🚀 Installation Options

### Option 1: Tampermonkey / Violentmonkey Userscript (Recommended - 100% Auto-Update)
1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) in your browser (Chrome, Brave, Edge, Firefox).
2. Click this direct install link: [**Install scaler-encrypted-chat.user.js directly from GitHub**](https://raw.githubusercontent.com/Aninda7479/ScalerLiveClassEncryptedChat/main/scaler-encrypted-chat.user.js)
3. Tampermonkey will prompt you to install. Click **Install**.
4. **Auto-Updates**: The script is configured with `@updateURL` and `@downloadURL`. Tampermonkey will silently and automatically keep it updated from GitHub whenever a new version is pushed!

### Option 2: Chrome Extension (Manifest V3)
1. Download the latest release `.zip` from [GitHub Releases](https://github.com/Aninda7479/ScalerLiveClassEncryptedChat/releases/latest) or clone this repo.
2. Open Google Chrome (or Brave / Edge) and go to `chrome://extensions`.
3. Enable **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the [`chrome-extension`](./chrome-extension) folder.
6. The extension icon will appear in your Chrome toolbar. Pin it for quick access!
7. **Auto-Update Detection**: The extension automatically checks GitHub Releases every 12 hours. When a new version is released, a `NEW` badge appears on the toolbar icon with a 1-click download banner inside the popup.
8. **1-Click Updater**: Double-click [`update.bat`](./update.bat) on Windows to instantly pull the latest release from GitHub into your extension folder, then simply click the reload icon in `chrome://extensions`.

---

## 🔄 How to Release a New Version (For Maintainers)

The repository includes a GitHub Actions CI/CD workflow (`.github/workflows/release.yml`) that automatically packages and publishes releases.

To publish a new version:
1. Update version strings in:
   - [`chrome-extension/manifest.json`](./chrome-extension/manifest.json) (`"version": "1.4.0"`)
   - [`scaler-encrypted-chat.user.js`](./scaler-encrypted-chat.user.js) (`// @version 1.4.0`)
2. Commit and tag:
   ```bash
   git add .
   git commit -m "chore: release v1.4.0"
   git tag v1.4.0
   git push origin main --tags
   ```
3. GitHub Actions will automatically:
   - Package the `chrome-extension` into `ScalerLiveClassEncryptedChat-ChromeExtension.zip`
   - Create a GitHub Release for tag `v1.4.0`
   - Attach the zipped extension and userscript to the release
   - Tampermonkey users will receive the update automatically in the background
   - Extension users will see an update notification banner and badge in Chrome

---

## 🧪 Testing

### Automated Test Suites
Run the automated cryptographic and edge-case test suites:
```bash
node test/run_all.js
```
Or run individual test suites:
```bash
node test/test_crypto.js
node test/test_expanded.js
```

### Interactive Testbed (Offline Simulation)
A complete offline test harness based on the real Scaler classroom HTML has been created:
- Simply double-click or open [`test-scaler-chat.html`](./test-scaler-chat.html) in your browser.
- Use the simulation toolbar at the top:
  - 📥 **Simulate 'SST' Message**: Tests incoming message with pre-given default key `SST2030@Aninda`.
  - 📥 **Simulate 'Unknown Key' Message**: Tests incoming locked message with unlock prompt.
- Type any message in the chat box at the bottom right and click **"🔒 Encrypt & Send"**!

---

## 📖 How It Works

### Encrypted Message Structure
Messages sent through the tool are formatted as:
```text
🔒[ENC:v1:<fingerprint>:<base64(salt + iv + ciphertext + gcmTag)>]
```
- **Plaintext view for people without the extension/key**: They only see the ciphertext string, completely unreadable and protected by AES-256.
- **Plaintext view for you & your friends with the key**: Automatically rendered as a private message card with the profile name and color badge!

---

## 📁 Repository Structure
 
```text
├── .github/workflows/release.yml   # GitHub Actions automated release workflow
├── update.bat                      # 1-click Windows updater helper
├── logo.svg                        # Master vector SVG logo
├── scaler-encrypted-chat.user.js   # Tampermonkey / Violentmonkey Userscript (auto-updating)
├── chrome-extension/               # Chrome Extension (Manifest V3)
│   ├── manifest.json               # Extension manifest (v1.3.0)
│   ├── background.js               # Service worker for periodic GitHub update checks
│   ├── content.js                  # Content script (injection & live observer)
│   ├── content.css                 # Scaler-themed styles
│   ├── popup.html                  # Toolbar popup UI with update banner
│   ├── popup.js                    # Toolbar popup logic with update detection
│   └── icons/                      # Extension icons (logo.svg, icon16, icon48, icon128)
├── test/                           # Automated test suites
│   ├── run_all.js                  # Test suite runner
│   ├── test_crypto.js              # Crypto engine test suite (6 tests)
│   └── test_expanded.js            # Edge-case & Unicode test suite (4 tests)
├── test-scaler-chat.html           # Runnable interactive test harness
├── build_testbed.js                # Generator for testbed
├── page.html                       # Original Scaler classroom HTML
└── README.md                       # Documentation
```

---

## 👤 Author

- **Aninda** — [Aninda7479 (Aninda) · GitHub](https://github.com/Aninda7479)


