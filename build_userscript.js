const fs = require('fs');
const path = require('path');

function buildUserscript() {
  const rootDir = __dirname;
  const manifestPath = path.join(rootDir, 'chrome-extension', 'manifest.json');
  const cssPath = path.join(rootDir, 'chrome-extension', 'content.css');
  const jsPath = path.join(rootDir, 'chrome-extension', 'content.js');
  const outPath = path.join(rootDir, 'scaler-encrypted-chat.user.js');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const jsContent = fs.readFileSync(jsPath, 'utf8');

  const version = manifest.version || '1.4.0';
  const author = manifest.author || 'Aninda';
  const homepageUrl = manifest.homepage_url || 'https://github.com/Aninda7479/ScalerLiveClassEncryptedChat';
  const description = manifest.description || 'Clean, Adaptive End-to-End Encrypted Private Chat for Scaler Academy.';

  const header = `// ==UserScript==
// @name         Scaler Academy - Encrypted Private Chat
// @namespace    https://scaler.com/
// @version      ${version}
// @description  ${description}
// @author       ${author}
// @homepageURL  ${homepageUrl}
// @updateURL    https://raw.githubusercontent.com/Aninda7479/ScalerLiveClassEncryptedChat/main/scaler-encrypted-chat.user.js
// @downloadURL  https://raw.githubusercontent.com/Aninda7479/ScalerLiveClassEncryptedChat/main/scaler-encrypted-chat.user.js
// @match        *://scaler.com/*
// @match        *://*.scaler.com/*
// @match        file://*/*page.html*
// @match        file://*/*test-scaler-chat.html*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// ==/UserScript==
`;

  // Extract the inner content of content.js (inside (function () { 'use strict'; ... })())
  const iifeStart = jsContent.indexOf("'use strict';");
  if (iifeStart === -1) {
    throw new Error("Could not find 'use strict'; in content.js");
  }

  const innerStart = iifeStart + "'use strict';".length;
  const lastParen = jsContent.lastIndexOf('})();');
  if (lastParen === -1) {
    throw new Error('Could not find })(); at end of content.js');
  }

  const innerJs = jsContent.substring(innerStart, lastParen).trim();

  const styleInjectionCode = `  // --- STYLES INJECTION ---
  function injectStyles() {
    if (document.getElementById('scaler-enc-robust-styles')) return;
    if (typeof GM_addStyle !== 'undefined') {
      try {
        GM_addStyle(${JSON.stringify(cssContent)});
        return;
      } catch (e) {}
    }
    const style = document.createElement('style');
    style.id = 'scaler-enc-robust-styles';
    style.textContent = ${JSON.stringify(cssContent)};
    (document.head || document.documentElement).appendChild(style);
  }

  injectStyles();
`;

  const finalUserscript = `${header}
(function () {
  'use strict';

${styleInjectionCode}
  ${innerJs}
})();
`;

  fs.writeFileSync(outPath, finalUserscript, 'utf8');
  console.log(`[OK] Successfully built ${outPath} (v${version}, ${finalUserscript.length} bytes)`);

  return finalUserscript;
}

if (require.main === module) {
  buildUserscript();
}

module.exports = { buildUserscript };
