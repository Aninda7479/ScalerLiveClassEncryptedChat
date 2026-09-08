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

### Option 1: Tampermonkey / Violentmonkey Userscript (Recommended)
1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) in your browser (Chrome, Brave, Edge, Firefox).
2. Open the Tampermonkey Dashboard -> **Utilities** -> **Install from file** (or click **+ Add a new script**).
3. Paste the contents of [`scaler-encrypted-chat.user.js`](./scaler-encrypted-chat.user.js) and click **Save** (`Ctrl + S`).
4. Navigate to any Scaler Academy live class session (e.g., `https://www.scaler.com/academy/mentee-dashboard/class/576935/session?joinSession=1`). The encryption toolbar will appear right above the chat input box!

### Option 2: Chrome Extension (Manifest V3)
1. Open Google Chrome (or Brave / Edge) and go to `chrome://extensions`.
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the [`chrome-extension`](./chrome-extension) folder in this repository.
5. The extension icon will appear in your Chrome toolbar. Pin it for quick access!

---

## 🧪 Try It Offline (Interactive Testbed)

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
├── logo.svg                        # Master vector SVG logo
├── scaler-encrypted-chat.user.js   # Tampermonkey / Violentmonkey Userscript
├── chrome-extension/               # Chrome Extension (Manifest V3)
│   ├── manifest.json               # Extension manifest
│   ├── content.js                  # Content script (injection & live observer)
│   ├── content.css                 # Scaler-themed styles
│   ├── popup.html                  # Toolbar popup UI
│   ├── popup.js                    # Toolbar popup logic
│   └── icons/                      # Extension icons (logo.svg, icon16, icon48, icon128)
├── test-scaler-chat.html           # Runnable interactive test harness
├── build_testbed.js                # Generator for testbed
├── test_crypto.js                  # Automated test suite (6 tests)
├── test_expanded.js                # Edge-case & Unicode test suite (4 tests)
├── page.html                       # Original Scaler classroom HTML
└── README.md                       # Documentation
```

---

## 👤 Author

- **Aninda** — [Aninda7479 (Aninda) · GitHub](https://github.com/Aninda7479)

