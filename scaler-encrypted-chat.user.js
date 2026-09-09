// ==UserScript==
// @name         Scaler Academy - Encrypted Private Chat
// @namespace    https://scaler.com/
// @version      1.4.0
// @description  Clean, Adaptive End-to-End Encrypted Private Chat for Scaler Academy. Fixed key selection, high-contrast menus, key reveal toggle, auto-decryption, and encrypted image/GIF sharing with lightbox viewer.
// @author       Aninda
// @homepageURL  https://github.com/Aninda7479/ScalerLiveClassEncryptedChat
// @updateURL    https://raw.githubusercontent.com/Aninda7479/ScalerLiveClassEncryptedChat/main/scaler-encrypted-chat.user.js
// @downloadURL  https://raw.githubusercontent.com/Aninda7479/ScalerLiveClassEncryptedChat/main/scaler-encrypted-chat.user.js
// @match        https://www.scaler.com/academy/mentee-dashboard/class/*
// @match        https://*.scaler.com/*
// @match        file://*/*page.html*
// @match        file://*/*test-scaler-chat.html*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // --- STYLES INJECTION ---
  function injectStyles() {
    if (document.getElementById('scaler-enc-robust-styles')) return;
    const style = document.createElement('style');
    style.id = 'scaler-enc-robust-styles';
    style.textContent = "/* Scaler Encrypted Chat - Clean, High-Contrast & Adaptive Stylesheet */\n\n.chat-input__controls {\n  display: flex !important;\n  justify-content: space-between !important;\n  align-items: center !important;\n}\n\n.scaler-enc-controls-wrapper {\n  display: inline-flex !important;\n  align-items: center !important;\n  margin-left: auto !important;\n  white-space: nowrap !important;\n  flex-shrink: 0 !important;\n}\n\n.scaler-enc-pill-btn {\n  display: inline-flex !important;\n  align-items: center !important;\n  gap: 6px !important;\n  padding: 3px 10px !important;\n  border-radius: 14px !important;\n  background: rgba(100, 116, 139, 0.15) !important;\n  color: inherit !important;\n  font-size: 11px !important;\n  font-weight: 600 !important;\n  cursor: pointer !important;\n  border: 1px solid rgba(100, 116, 139, 0.3) !important;\n  transition: all 0.15s ease !important;\n  line-height: 1.2 !important;\n  user-select: none !important;\n  white-space: nowrap !important;\n  flex-shrink: 0 !important;\n}\n\n.scaler-enc-pill-btn:hover {\n  background: rgba(100, 116, 139, 0.25) !important;\n  border-color: rgba(100, 116, 139, 0.45) !important;\n}\n\n.scaler-enc-color-dot {\n  width: 8px !important;\n  height: 8px !important;\n  border-radius: 50% !important;\n  display: inline-block !important;\n  flex-shrink: 0 !important;\n}\n\n#scaler-enc-current-name {\n  white-space: nowrap !important;\n  display: inline-block !important;\n}\n\n/* Floating Dropdown attached directly to body with guaranteed solid contrast */\n#scaler-enc-floating-menu {\n  position: fixed !important;\n  min-width: 190px !important;\n  width: 190px !important;\n  background: #0f172a !important;\n  color: #f8fafc !important;\n  border: 1px solid #334155 !important;\n  border-radius: 8px !important;\n  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.6), 0 6px 12px -2px rgba(0, 0, 0, 0.4) !important;\n  padding: 6px !important;\n  z-index: 2147483647 !important;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif !important;\n  font-size: 12px !important;\n  box-sizing: border-box !important;\n  display: none;\n}\n\n#scaler-enc-floating-menu * {\n  box-sizing: border-box !important;\n}\n\n.scaler-enc-menu-header {\n  font-size: 10px !important;\n  font-weight: 700 !important;\n  color: #94a3b8 !important;\n  padding: 4px 8px !important;\n  text-transform: uppercase !important;\n  letter-spacing: 0.5px !important;\n}\n\n.scaler-enc-menu-item {\n  display: flex !important;\n  align-items: center !important;\n  justify-content: space-between !important;\n  padding: 7px 9px !important;\n  border-radius: 6px !important;\n  cursor: pointer !important;\n  transition: background 0.12s !important;\n  color: #f1f5f9 !important;\n  background: transparent !important;\n  margin-bottom: 2px !important;\n}\n\n.scaler-enc-menu-item:hover {\n  background: #1e293b !important;\n  color: #ffffff !important;\n}\n\n.scaler-enc-menu-item.active {\n  background: rgba(56, 189, 248, 0.18) !important;\n  color: #38bdf8 !important;\n  font-weight: 600 !important;\n}\n\n.scaler-enc-menu-divider {\n  height: 1px !important;\n  background: #334155 !important;\n  margin: 5px 0 !important;\n}\n\n.scaler-enc-menu-btn-settings {\n  color: #38bdf8 !important;\n  font-weight: 600 !important;\n}\n\n/* Lock Send Button */\n.scaler-enc-lock-btn {\n  display: inline-flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  width: 32px !important;\n  height: 32px !important;\n  border-radius: 4px !important;\n  background: transparent !important;\n  color: #0284c7 !important;\n  border: 1px solid rgba(2, 132, 199, 0.35) !important;\n  cursor: pointer !important;\n  transition: all 0.15s ease !important;\n  margin-left: 4px !important;\n  padding: 0 !important;\n}\n\n.scaler-enc-lock-btn:hover {\n  background: #0284c7 !important;\n  color: #ffffff !important;\n  border-color: #0284c7 !important;\n  transform: scale(1.05) !important;\n}\n\n.scaler-enc-lock-btn:active {\n  transform: scale(0.96) !important;\n}\n\n/* Decrypted Message Inside Bubble */\n.scaler-enc-clean-msg {\n  display: block !important;\n  margin: 2px 0 !important;\n}\n\n.scaler-enc-badge-row {\n  display: flex !important;\n  align-items: center !important;\n  gap: 6px !important;\n  margin-bottom: 3px !important;\n}\n\n.scaler-enc-chip {\n  display: inline-flex !important;\n  align-items: center !important;\n  gap: 4px !important;\n  padding: 1px 7px !important;\n  border-radius: 10px !important;\n  font-size: 10px !important;\n  font-weight: 700 !important;\n  letter-spacing: 0.3px !important;\n  line-height: 1.4 !important;\n}\n\n.scaler-enc-raw-toggle {\n  font-size: 9px !important;\n  opacity: 0.5 !important;\n  cursor: pointer !important;\n  user-select: none !important;\n  transition: opacity 0.15s !important;\n}\n\n.scaler-enc-raw-toggle:hover {\n  opacity: 0.9 !important;\n  text-decoration: underline !important;\n}\n\n.scaler-enc-content {\n  font-size: inherit !important;\n  line-height: inherit !important;\n  color: inherit !important;\n  white-space: pre-wrap !important;\n  word-break: break-word !important;\n}\n\n.scaler-enc-raw-text {\n  margin-top: 4px !important;\n  padding: 4px 6px !important;\n  background: rgba(0, 0, 0, 0.08) !important;\n  border-radius: 4px !important;\n  font-family: monospace !important;\n  font-size: 10px !important;\n  color: inherit !important;\n  opacity: 0.75 !important;\n  word-break: break-all !important;\n}\n\n.scaler-enc-locked-msg {\n  display: inline-flex !important;\n  align-items: center !important;\n  gap: 6px !important;\n  padding: 3px 8px !important;\n  border-radius: 6px !important;\n  background: rgba(245, 158, 11, 0.12) !important;\n  border: 1px solid rgba(245, 158, 11, 0.3) !important;\n  color: #b45309 !important;\n  font-size: 11px !important;\n}\n\n.scaler-enc-unlock-link {\n  background: #d97706 !important;\n  color: #fff !important;\n  border: none !important;\n  padding: 2px 6px !important;\n  border-radius: 3px !important;\n  font-size: 10px !important;\n  font-weight: 600 !important;\n  cursor: pointer !important;\n}\n\n/* Modal */\n.scaler-enc-modal-overlay {\n  position: fixed !important;\n  top: 0 !important;\n  left: 0 !important;\n  right: 0 !important;\n  bottom: 0 !important;\n  background: rgba(15, 23, 42, 0.65) !important;\n  display: flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  z-index: 2147483647 !important;\n  backdrop-filter: blur(3px) !important;\n}\n\n.scaler-enc-modal {\n  background: #0f172a !important;\n  border: 1px solid #334155 !important;\n  border-radius: 12px !important;\n  width: 360px !important;\n  max-width: 92vw !important;\n  max-height: 85vh !important;\n  overflow-y: auto !important;\n  color: #f1f5f9 !important;\n  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif !important;\n}\n\n.scaler-enc-modal-header {\n  display: flex !important;\n  align-items: center !important;\n  justify-content: space-between !important;\n  padding: 12px 16px !important;\n  border-bottom: 1px solid #1e293b !important;\n}\n\n.scaler-enc-modal-title {\n  font-size: 14px !important;\n  font-weight: 700 !important;\n  display: flex !important;\n  align-items: center !important;\n  gap: 6px !important;\n  color: #38bdf8 !important;\n}\n\n.scaler-enc-modal-close {\n  background: transparent !important;\n  border: none !important;\n  color: #94a3b8 !important;\n  font-size: 16px !important;\n  cursor: pointer !important;\n}\n\n.scaler-enc-modal-body {\n  padding: 14px 16px !important;\n}\n\n.scaler-enc-modal-card {\n  background: #1e293b !important;\n  border: 1px solid #334155 !important;\n  border-radius: 8px !important;\n  padding: 8px 10px !important;\n  margin-bottom: 6px !important;\n}\n\n.scaler-enc-modal-card.active {\n  border-color: #38bdf8 !important;\n  background: #17253b !important;\n}\n\n.scaler-enc-key-box {\n  display: flex !important;\n  align-items: center !important;\n  gap: 6px !important;\n  background: rgba(0, 0, 0, 0.25) !important;\n  padding: 3px 8px !important;\n  border-radius: 4px !important;\n  font-size: 11px !important;\n  margin-top: 5px !important;\n}\n\n/* Image Attachment & Media Buttons */\n.scaler-enc-attach-btn {\n  display: inline-flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  width: 32px !important;\n  height: 32px !important;\n  border-radius: 4px !important;\n  background: transparent !important;\n  color: #38bdf8 !important;\n  border: 1px solid rgba(56, 189, 248, 0.35) !important;\n  cursor: pointer !important;\n  transition: all 0.15s ease !important;\n  margin-left: 4px !important;\n  padding: 0 !important;\n}\n\n.scaler-enc-attach-btn:hover {\n  background: #38bdf8 !important;\n  color: #0f172a !important;\n  border-color: #38bdf8 !important;\n  transform: scale(1.05) !important;\n}\n\n.scaler-enc-attach-btn:active {\n  transform: scale(0.96) !important;\n}\n\n/* Drag and Drop Zone Overlay */\n.scaler-enc-drop-active {\n  position: relative !important;\n}\n\n.scaler-enc-drop-active::after {\n  content: \"📁 Drop Image or GIF here to Encrypt & Send 🔒\" !important;\n  position: absolute !important;\n  inset: 0 !important;\n  background: rgba(15, 23, 42, 0.92) !important;\n  border: 2px dashed #38bdf8 !important;\n  border-radius: 8px !important;\n  color: #38bdf8 !important;\n  font-size: 13px !important;\n  font-weight: 700 !important;\n  display: flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  z-index: 99999 !important;\n  pointer-events: none !important;\n  box-shadow: inset 0 0 20px rgba(56, 189, 248, 0.25) !important;\n}\n\n/* Staging Bar above Textarea */\n.scaler-enc-image-stage {\n  display: flex !important;\n  flex-direction: column !important;\n  gap: 8px !important;\n  background: #0f172a !important;\n  border: 1px solid #334155 !important;\n  border-bottom: 2px solid #0284c7 !important;\n  border-radius: 8px 8px 0 0 !important;\n  padding: 10px 12px !important;\n  margin-bottom: 4px !important;\n  color: #f8fafc !important;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif !important;\n  animation: scalerEncSlideDown 0.2s ease-out !important;\n}\n\n@keyframes scalerEncSlideDown {\n  from { opacity: 0; transform: translateY(-8px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n\n.scaler-enc-stage-main {\n  display: flex !important;\n  align-items: center !important;\n  gap: 12px !important;\n}\n\n.scaler-enc-stage-thumb-box {\n  position: relative !important;\n  width: 58px !important;\n  height: 58px !important;\n  border-radius: 6px !important;\n  overflow: hidden !important;\n  border: 1px solid #334155 !important;\n  background: #1e293b !important;\n  flex-shrink: 0 !important;\n  display: flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n}\n\n.scaler-enc-stage-thumb {\n  width: 100% !important;\n  height: 100% !important;\n  object-fit: contain !important;\n}\n\n.scaler-enc-stage-info {\n  flex: 1 !important;\n  display: flex !important;\n  flex-direction: column !important;\n  gap: 4px !important;\n  overflow: hidden !important;\n}\n\n.scaler-enc-stage-title-row {\n  display: flex !important;\n  align-items: center !important;\n  gap: 6px !important;\n}\n\n.scaler-enc-stage-title {\n  font-size: 12px !important;\n  font-weight: 600 !important;\n  color: #f1f5f9 !important;\n}\n\n.scaler-enc-badge {\n  font-size: 9px !important;\n  font-weight: 700 !important;\n  padding: 1px 5px !important;\n  border-radius: 4px !important;\n  text-transform: uppercase !important;\n  letter-spacing: 0.5px !important;\n}\n\n.scaler-enc-badge-gif {\n  background: #ec4899 !important;\n  color: #ffffff !important;\n}\n\n.scaler-enc-badge-size {\n  background: #1e293b !important;\n  color: #94a3b8 !important;\n  border: 1px solid #334155 !important;\n}\n\n.scaler-enc-badge-chunk {\n  background: #f59e0b !important;\n  color: #1e1b4b !important;\n}\n\n.scaler-enc-stage-caption-input {\n  width: 100% !important;\n  background: #1e293b !important;\n  border: 1px solid #334155 !important;\n  border-radius: 5px !important;\n  color: #f8fafc !important;\n  padding: 5px 8px !important;\n  font-size: 11px !important;\n  box-sizing: border-box !important;\n}\n\n.scaler-enc-stage-caption-input:focus {\n  outline: none !important;\n  border-color: #38bdf8 !important;\n}\n\n.scaler-enc-stage-actions {\n  display: flex !important;\n  align-items: center !important;\n  gap: 8px !important;\n  margin-top: 2px !important;\n}\n\n.scaler-enc-stage-send-btn {\n  background: #0284c7 !important;\n  color: #ffffff !important;\n  border: none !important;\n  border-radius: 5px !important;\n  padding: 6px 12px !important;\n  font-size: 11px !important;\n  font-weight: 600 !important;\n  cursor: pointer !important;\n  display: inline-flex !important;\n  align-items: center !important;\n  gap: 5px !important;\n  transition: background 0.15s ease !important;\n}\n\n.scaler-enc-stage-send-btn:hover {\n  background: #0369a1 !important;\n}\n\n.scaler-enc-stage-cancel-btn {\n  background: transparent !important;\n  color: #94a3b8 !important;\n  border: 1px solid #334155 !important;\n  border-radius: 5px !important;\n  padding: 5px 10px !important;\n  font-size: 11px !important;\n  cursor: pointer !important;\n}\n\n.scaler-enc-stage-cancel-btn:hover {\n  color: #f1f5f9 !important;\n  background: #1e293b !important;\n}\n\n.scaler-enc-stage-warning {\n  background: rgba(245, 158, 11, 0.15) !important;\n  border: 1px solid rgba(245, 158, 11, 0.4) !important;\n  border-radius: 5px !important;\n  padding: 6px 10px !important;\n  font-size: 11px !important;\n  color: #fbbf24 !important;\n  display: flex !important;\n  align-items: center !important;\n  justify-content: space-between !important;\n  gap: 8px !important;\n}\n\n.scaler-enc-stage-warning button {\n  background: #d97706 !important;\n  color: #ffffff !important;\n  border: none !important;\n  padding: 3px 8px !important;\n  border-radius: 4px !important;\n  font-size: 10px !important;\n  font-weight: 600 !important;\n  cursor: pointer !important;\n}\n\n/* Decrypted Chat Thumbnail */\n.scaler-enc-thumb-wrapper {\n  margin-top: 6px !important;\n  position: relative !important;\n  display: inline-block !important;\n  border-radius: 8px !important;\n  overflow: hidden !important;\n  background: #090d16 !important;\n  border: 1px solid rgba(255, 255, 255, 0.12) !important;\n  cursor: pointer !important;\n  transition: transform 0.15s ease, box-shadow 0.15s ease !important;\n  max-width: 100% !important;\n}\n\n.scaler-enc-thumb-wrapper:hover {\n  transform: translateY(-1px) !important;\n  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45) !important;\n  border-color: #38bdf8 !important;\n}\n\n.scaler-enc-thumb-img {\n  display: block !important;\n  max-height: 220px !important;\n  max-width: 100% !important;\n  object-fit: contain !important;\n  background: repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 16px 16px !important;\n}\n\n.scaler-enc-thumb-overlay {\n  position: absolute !important;\n  inset: 0 !important;\n  background: rgba(0, 0, 0, 0.25) !important;\n  opacity: 0 !important;\n  display: flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  color: #ffffff !important;\n  font-size: 18px !important;\n  transition: opacity 0.15s ease !important;\n}\n\n.scaler-enc-thumb-wrapper:hover .scaler-enc-thumb-overlay {\n  opacity: 1 !important;\n}\n\n.scaler-enc-gif-badge {\n  position: absolute !important;\n  top: 6px !important;\n  left: 6px !important;\n  background: rgba(236, 72, 153, 0.9) !important;\n  color: #ffffff !important;\n  font-size: 9px !important;\n  font-weight: 800 !important;\n  padding: 2px 6px !important;\n  border-radius: 4px !important;\n  letter-spacing: 0.5px !important;\n  pointer-events: none !important;\n}\n\n.scaler-enc-img-meta {\n  padding: 4px 8px !important;\n  background: rgba(15, 23, 42, 0.85) !important;\n  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;\n  font-size: 10px !important;\n  color: #94a3b8 !important;\n  display: flex !important;\n  align-items: center !important;\n  justify-content: space-between !important;\n  gap: 8px !important;\n}\n\n.scaler-enc-image-caption {\n  margin-top: 6px !important;\n  font-size: 12px !important;\n  line-height: 1.4 !important;\n  color: #f1f5f9 !important;\n  word-break: break-word !important;\n}\n\n/* Multi-chunk Receiving Progress */\n.scaler-enc-chunk-progress {\n  display: inline-flex !important;\n  align-items: center !important;\n  gap: 8px !important;\n  padding: 8px 12px !important;\n  background: #1e293b !important;\n  border: 1px dashed #38bdf8 !important;\n  border-radius: 6px !important;\n  color: #38bdf8 !important;\n  font-size: 11px !important;\n  font-weight: 500 !important;\n  margin-top: 4px !important;\n  animation: scalerEncPulse 1.5s infinite !important;\n}\n\n@keyframes scalerEncPulse {\n  0% { opacity: 0.6; }\n  50% { opacity: 1; }\n  100% { opacity: 0.6; }\n}\n\n/* Fullscreen Lightbox Image Viewer */\n.scaler-enc-lightbox-overlay {\n  position: fixed !important;\n  inset: 0 !important;\n  background: rgba(5, 8, 15, 0.92) !important;\n  backdrop-filter: blur(6px) !important;\n  z-index: 2147483646 !important;\n  display: flex !important;\n  flex-direction: column !important;\n  animation: scalerEncFadeIn 0.15s ease-out !important;\n}\n\n@keyframes scalerEncFadeIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n\n.scaler-enc-lightbox-header {\n  height: 48px !important;\n  background: rgba(15, 23, 42, 0.9) !important;\n  border-bottom: 1px solid #334155 !important;\n  display: flex !important;\n  align-items: center !important;\n  justify-content: space-between !important;\n  padding: 0 16px !important;\n  color: #f8fafc !important;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif !important;\n  flex-shrink: 0 !important;\n}\n\n.scaler-enc-lightbox-title {\n  display: flex !important;\n  align-items: center !important;\n  gap: 8px !important;\n  font-size: 13px !important;\n  font-weight: 600 !important;\n}\n\n.scaler-enc-lightbox-body {\n  flex: 1 !important;\n  display: flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  overflow: hidden !important;\n  position: relative !important;\n  padding: 20px !important;\n  cursor: grab !important;\n}\n\n.scaler-enc-lightbox-body:active {\n  cursor: grabbing !important;\n}\n\n.scaler-enc-lightbox-img {\n  max-width: 90vw !important;\n  max-height: 82vh !important;\n  object-fit: contain !important;\n  border-radius: 6px !important;\n  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7) !important;\n  transition: transform 0.12s ease-out !important;\n  user-select: none !important;\n}\n\n.scaler-enc-lightbox-toolbar {\n  height: 46px !important;\n  background: rgba(15, 23, 42, 0.9) !important;\n  border-top: 1px solid #334155 !important;\n  display: flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  gap: 10px !important;\n  padding: 0 16px !important;\n  flex-shrink: 0 !important;\n}\n\n.scaler-enc-lightbox-btn {\n  background: #1e293b !important;\n  color: #f1f5f9 !important;\n  border: 1px solid #334155 !important;\n  border-radius: 6px !important;\n  padding: 6px 12px !important;\n  font-size: 11px !important;\n  font-weight: 600 !important;\n  cursor: pointer !important;\n  display: inline-flex !important;\n  align-items: center !important;\n  gap: 6px !important;\n  transition: all 0.15s ease !important;\n}\n\n.scaler-enc-lightbox-btn:hover {\n  background: #334155 !important;\n  color: #38bdf8 !important;\n  border-color: #38bdf8 !important;\n}\n\n.scaler-enc-lightbox-close {\n  background: transparent !important;\n  color: #94a3b8 !important;\n  border: none !important;\n  font-size: 20px !important;\n  cursor: pointer !important;\n  padding: 4px 8px !important;\n  border-radius: 4px !important;\n}\n\n.scaler-enc-lightbox-close:hover {\n  color: #ef4444 !important;\n  background: rgba(239, 68, 68, 0.1) !important;\n}\n\n/* Toast Notifications */\n.scaler-enc-toast {\n  position: fixed !important;\n  bottom: 24px !important;\n  right: 24px !important;\n  background: #0f172a !important;\n  color: #f8fafc !important;\n  border: 1px solid #38bdf8 !important;\n  border-radius: 8px !important;\n  padding: 10px 16px !important;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif !important;\n  font-size: 12px !important;\n  font-weight: 500 !important;\n  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6) !important;\n  z-index: 2147483647 !important;\n  animation: scalerEncSlideUp 0.2s ease-out !important;\n  display: flex !important;\n  align-items: center !important;\n  gap: 8px !important;\n}\n\n@keyframes scalerEncSlideUp {\n  from { opacity: 0; transform: translateY(12px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n\n";
    (document.head || document.documentElement).appendChild(style);
  }


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
    if (typeof GM_getValue !== 'undefined') {
      try {
        const v = GM_getValue(key);
        if (v !== undefined) return v;
      } catch (e) {}
    }
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
    if (typeof GM_setValue !== 'undefined') {
      try {
        GM_setValue(key, value);
      } catch (e) {}
    }
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
      const defaultKey = 'SST2030@Aninda';
      const fp = await computeFingerprint(defaultKey);
      profiles = [
        {
          id: 'prof_sst',
          name: 'SST',
          key: defaultKey,
          fingerprint: fp,
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

  // --- TOAST NOTIFICATIONS ---
  function showToast(msg, duration = 3000) {
    const existing = document.querySelector('.scaler-enc-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'scaler-enc-toast';
    toast.innerHTML = `<span>${escapeHtml(msg)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
  }

  // --- GIF & IMAGE ADAPTIVE COMPRESSION ENGINE ---
  const TARGET_IMAGE_BYTES = 15000; // ~15 KB safe target for 1 single message

  function isAnimatedGifBytes(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    if (bytes.length < 16) return false;
    if (bytes[0] !== 0x47 || bytes[1] !== 0x49 || bytes[2] !== 0x46) return false; // GIF header
    let gceCount = 0;
    for (let i = 0; i < bytes.length - 2; i++) {
      if (bytes[i] === 0x21 && bytes[i + 1] === 0xF9) {
        gceCount++;
        if (gceCount > 1) return true;
      }
    }
    return false;
  }

  async function compressImageToTarget(file, targetBytes = TARGET_IMAGE_BYTES) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let origWidth = img.naturalWidth || img.width || 600;
          let origHeight = img.naturalHeight || img.height || 400;
          let maxDim = 850;
          let curWidth = origWidth;
          let curHeight = origHeight;

          if (curWidth > maxDim || curHeight > maxDim) {
            if (curWidth > curHeight) {
              curHeight = Math.round((curHeight * maxDim) / curWidth);
              curWidth = maxDim;
            } else {
              curWidth = Math.round((curWidth * maxDim) / curHeight);
              curHeight = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = curWidth;
          canvas.height = curHeight;
          const ctx = canvas.getContext('2d');

          // White background prevents transparent PNG alpha from turning black in JPEG/WebP
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, curWidth, curHeight);
          ctx.drawImage(img, 0, 0, curWidth, curHeight);

          // Determine preferred MIME
          let mime = 'image/webp';
          let testUrl = canvas.toDataURL('image/webp', 0.8);
          if (!testUrl.startsWith('data:image/webp')) {
            mime = 'image/jpeg';
          }

          let bestDataUrl = '';
          let bestBytes = Infinity;
          const qualities = [0.75, 0.6, 0.45, 0.32, 0.2];

          for (const q of qualities) {
            const dUrl = canvas.toDataURL(mime, q);
            const b64Data = dUrl.substring(dUrl.indexOf(',') + 1);
            const byteSize = Math.round((b64Data.length * 3) / 4);
            bestDataUrl = dUrl;
            bestBytes = byteSize;
            if (byteSize <= targetBytes) break;
          }

          // If still larger, scale dimensions down further
          if (bestBytes > targetBytes && curWidth > 380 && curHeight > 380) {
            const scaleDown = 0.68;
            curWidth = Math.round(curWidth * scaleDown);
            curHeight = Math.round(curHeight * scaleDown);
            canvas.width = curWidth;
            canvas.height = curHeight;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, curWidth, curHeight);
            ctx.drawImage(img, 0, 0, curWidth, curHeight);

            for (const q of [0.55, 0.38, 0.22]) {
              const dUrl = canvas.toDataURL(mime, q);
              const b64Data = dUrl.substring(dUrl.indexOf(',') + 1);
              const byteSize = Math.round((b64Data.length * 3) / 4);
              bestDataUrl = dUrl;
              bestBytes = byteSize;
              if (byteSize <= targetBytes) break;
            }
          }

          canvas.width = 0;
          canvas.height = 0;

          resolve({
            dataUrl: bestDataUrl,
            binaryBytes: bestBytes,
            width: curWidth,
            height: curHeight,
            mime: mime
          });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  function splitDataIntoChunks(dataUrl, mime, caption, animated, maxChunkChars = 19000) {
    const commaIdx = dataUrl.indexOf(',');
    const b64Data = commaIdx !== -1 ? dataUrl.substring(commaIdx + 1) : dataUrl;
    const totalLen = b64Data.length;
    const numChunks = Math.ceil(totalLen / maxChunkChars);
    const chunkId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
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

  async function sendEncryptedPayloads(payloadList, textarea) {
    const prof = getActiveProfile();
    if (!prof) {
      alert('Please select or create a key profile first!');
      openProfilesModal();
      return;
    }

    for (let i = 0; i < payloadList.length; i++) {
      const plaintext = typeof payloadList[i] === 'string' ? payloadList[i] : JSON.stringify(payloadList[i]);
      const encrypted = await encryptText(plaintext, prof.key);
      const byteLen = new Blob([encrypted]).size;
      if (byteLen > 32700) {
        showToast('⚠️ Chunk exceeds 32KB Agora limit. Sending aborted.');
        return;
      }

      setReactInputValue(textarea, encrypted);
      await new Promise(r => setTimeout(r, 60));
      triggerSendMessage(textarea);

      if (i < payloadList.length - 1) {
        showToast(`Sending part ${i + 1} of ${payloadList.length}...`, 1000);
        await new Promise(r => setTimeout(r, 140));
      }
    }
  }

  // --- MEDIA STAGING & SENDING UI ---
  let pendingStagedMedia = null;

  function clearStagedMedia() {
    pendingStagedMedia = null;
    const existing = document.querySelector('.scaler-enc-image-stage');
    if (existing) existing.remove();
  }

  function stageMediaForSending(mediaObj, textarea) {
    clearStagedMedia();
    pendingStagedMedia = mediaObj;

    const chatInputField = textarea.closest('.chat-input__field') || textarea.parentElement;

    const stageBox = document.createElement('div');
    stageBox.className = 'scaler-enc-image-stage';

    const kbSize = (mediaObj.binaryBytes / 1024).toFixed(1);
    const isGif = !!mediaObj.isAnimatedGif;
    const requiresChunks = mediaObj.binaryBytes > TARGET_IMAGE_BYTES;
    const isVeryLargeGif = isGif && mediaObj.binaryBytes > 75000;

    stageBox.innerHTML = `
      <div class="scaler-enc-stage-main">
        <div class="scaler-enc-stage-thumb-box">
          <img class="scaler-enc-stage-thumb" src="${escapeHtml(mediaObj.dataUrl)}" alt="Stage thumbnail" />
        </div>
        <div class="scaler-enc-stage-info">
          <div class="scaler-enc-stage-title-row">
            <span class="scaler-enc-stage-title">${isGif ? 'Animated GIF' : 'Image ready to send'}</span>
            ${isGif ? '<span class="scaler-enc-badge scaler-enc-badge-gif">GIF</span>' : ''}
            <span class="scaler-enc-badge scaler-enc-badge-size">${kbSize} KB</span>
            ${requiresChunks ? '<span class="scaler-enc-badge scaler-enc-badge-chunk">Multi-chunk</span>' : '<span class="scaler-enc-badge scaler-enc-badge-size" style="color: #38bdf8;">Single msg</span>'}
          </div>
          <input type="text" class="scaler-enc-stage-caption-input" placeholder="Add a caption... (optional)" />
        </div>
      </div>
      ${isVeryLargeGif ? `
        <div class="scaler-enc-stage-warning">
          <span>⚠️ GIF is large (${kbSize} KB). Recommend sending 1st frame as static image.</span>
          <button id="scaler-enc-stage-frame-btn">Send 1st Frame</button>
        </div>
      ` : ''}
      <div class="scaler-enc-stage-actions">
        <button class="scaler-enc-stage-send-btn" id="scaler-enc-stage-send-btn">
          🔒 Encrypt & Send ${isGif ? 'GIF' : 'Image'}
        </button>
        <button class="scaler-enc-stage-cancel-btn" id="scaler-enc-stage-cancel-btn">✕ Cancel</button>
      </div>
    `;

    if (chatInputField) {
      chatInputField.parentElement.insertBefore(stageBox, chatInputField);
    } else {
      textarea.parentElement.insertBefore(stageBox, textarea);
    }

    const captionInput = stageBox.querySelector('.scaler-enc-stage-caption-input');
    captionInput.focus();

    captionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        stageBox.querySelector('#scaler-enc-stage-send-btn').click();
      }
    });

    if (isVeryLargeGif) {
      stageBox.querySelector('#scaler-enc-stage-frame-btn').addEventListener('click', async () => {
        showToast('Extracting 1st frame...');
        const compressed = await compressImageToTarget(mediaObj.rawFile, TARGET_IMAGE_BYTES);
        stageMediaForSending({
          dataUrl: compressed.dataUrl,
          binaryBytes: compressed.binaryBytes,
          width: compressed.width,
          height: compressed.height,
          mime: compressed.mime,
          isAnimatedGif: false
        }, textarea);
      });
    }

    stageBox.querySelector('#scaler-enc-stage-cancel-btn').addEventListener('click', () => {
      clearStagedMedia();
    });

    stageBox.querySelector('#scaler-enc-stage-send-btn').addEventListener('click', async () => {
      const caption = captionInput.value.trim();
      const currentMedia = pendingStagedMedia;
      clearStagedMedia();

      if (!currentMedia) return;

      if (currentMedia.binaryBytes <= TARGET_IMAGE_BYTES) {
        // Single message
        const payload = {
          v: 1,
          type: 'image',
          mime: currentMedia.mime,
          src: currentMedia.dataUrl,
          caption: caption || undefined,
          animated: !!currentMedia.isAnimatedGif
        };
        await sendEncryptedPayloads([payload], textarea);
      } else {
        // Multi-chunk message
        const chunks = splitDataIntoChunks(
          currentMedia.dataUrl,
          currentMedia.mime,
          caption,
          !!currentMedia.isAnimatedGif
        );
        showToast(`Sending in ${chunks.length} encrypted parts...`);
        await sendEncryptedPayloads(chunks, textarea);
      }
    });
  }

  async function handleFileSelection(file, textarea) {
    if (!file) return;

    if (file.type === 'image/gif' || file.name?.toLowerCase().endsWith('.gif')) {
      const buffer = await file.arrayBuffer();
      const isAnim = isAnimatedGifBytes(buffer);
      if (isAnim) {
        // Handle animated GIF
        const reader = new FileReader();
        reader.onload = () => {
          stageMediaForSending({
            dataUrl: reader.result,
            binaryBytes: file.size,
            mime: 'image/gif',
            isAnimatedGif: true,
            rawFile: file
          }, textarea);
        };
        reader.readAsDataURL(file);
        return;
      }
    }

    // Static image or single-frame GIF
    showToast('Compressing image for encrypted chat...');
    try {
      const compressed = await compressImageToTarget(file, TARGET_IMAGE_BYTES);
      stageMediaForSending({
        dataUrl: compressed.dataUrl,
        binaryBytes: compressed.binaryBytes,
        width: compressed.width,
        height: compressed.height,
        mime: compressed.mime,
        isAnimatedGif: false
      }, textarea);
    } catch (e) {
      alert('Failed to process image: ' + e.message);
    }
  }

  function setupMediaDropAndPaste(textarea, chatInputWrapper) {
    if (textarea.dataset.scalerEncMediaBound === 'true') return;
    textarea.dataset.scalerEncMediaBound = 'true';

    // 1. Paste listener
    textarea.addEventListener('paste', async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            await handleFileSelection(file, textarea);
            return;
          }
        }
      }
    });

    // 2. Drag & Drop listeners
    const dropTarget = chatInputWrapper || textarea;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropTarget.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropTarget.classList.add('scaler-enc-drop-active');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropTarget.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropTarget.classList.remove('scaler-enc-drop-active');
      }, false);
    });

    dropTarget.addEventListener('drop', async (e) => {
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/') || file.name.match(/\.(png|jpe?g|webp|gif)$/i)) {
          await handleFileSelection(file, textarea);
        }
      }
    });
  }

  // --- INJECT CLEAN CONTROLS INTO SCALER'S CHAT BAR ---
  function injectNativeChatControls() {
    const textarea = document.querySelector('textarea.chat-input__textarea, [data-cy="meetings-sidebar-chat-input-area"]');
    if (!textarea) return;

    const chatInputField = textarea.closest('.chat-input__field') || textarea.parentElement;
    const chatControls = textarea.closest('.chat-input')?.querySelector('.chat-input__controls') || document.querySelector('.chat-input__controls');
    const chatInputWrapper = textarea.closest('.chat-input') || chatInputField;

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
      
      // Hidden file input for attachment
      let fileInput = chatInputField.querySelector('.scaler-enc-hidden-file-input');
      if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,.gif';
        fileInput.className = 'scaler-enc-hidden-file-input';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', async () => {
          if (fileInput.files && fileInput.files[0]) {
            await handleFileSelection(fileInput.files[0], textarea);
            fileInput.value = '';
          }
        });
        chatInputField.appendChild(fileInput);
      }

      // Attachment button (📷)
      const attachBtn = document.createElement('a');
      attachBtn.className = 'tappable btn btn-icon btn-small scaler-enc-attach-btn';
      attachBtn.title = 'Encrypt & Send Image/GIF';
      attachBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
      `;
      attachBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
      });

      // Lock button
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
        emojiDropdown.parentElement.insertBefore(attachBtn, emojiDropdown.nextSibling);
        emojiDropdown.parentElement.insertBefore(lockBtn, attachBtn.nextSibling);
      } else {
        chatInputField.appendChild(attachBtn);
        chatInputField.appendChild(lockBtn);
      }

      setupMediaDropAndPaste(textarea, chatInputWrapper);
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
    if (pendingStagedMedia) {
      const stageBtn = document.getElementById('scaler-enc-stage-send-btn');
      if (stageBtn) {
        stageBtn.click();
        return;
      }
    }

    const text = textarea.value.trim();
    if (!text) return;

    const prof = getActiveProfile();
    if (!prof) {
      alert('Please select or create a key profile first!');
      openProfilesModal();
      return;
    }

    const encrypted = await encryptText(text, prof.key);
    const byteLen = new Blob([encrypted]).size;
    if (byteLen > 32700) {
      showToast(`⚠️ Message too long (${byteLen} bytes). Max is 32KB. Please shorten.`);
      return;
    }

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

  // --- MULTI-CHUNK IMAGE ASSEMBLER ---
  const chunkBuffer = new Map();

  function handleIncomingImageChunk(chunk, profile, rawToken, container) {
    const { id, seq, total, data, mime, caption, animated } = chunk;
    if (!id || !seq || !total || !data) return { complete: false, progress: 'Invalid chunk' };

    let entry = chunkBuffer.get(id);
    if (!entry) {
      entry = {
        id,
        total,
        chunks: new Map(),
        mime: mime || 'image/webp',
        caption: caption || '',
        animated: !!animated,
        profile,
        container,
        createdAt: Date.now()
      };
      chunkBuffer.set(id, entry);

      // Memory cleanup: expire incomplete chunk buffers after 60s
      setTimeout(() => {
        if (chunkBuffer.has(id)) chunkBuffer.delete(id);
      }, 60000);
    }

    entry.chunks.set(seq, data);
    if (mime) entry.mime = mime;
    if (caption) entry.caption = caption;
    if (animated !== undefined) entry.animated = animated;

    if (entry.chunks.size >= total) {
      let fullBase64 = '';
      for (let s = 1; s <= total; s++) {
        fullBase64 += entry.chunks.get(s) || '';
      }
      chunkBuffer.delete(id);
      const dataUrl = `data:${entry.mime};base64,${fullBase64}`;
      return {
        complete: true,
        media: {
          v: 1,
          type: 'image',
          mime: entry.mime,
          src: dataUrl,
          caption: entry.caption,
          animated: entry.animated
        }
      };
    }

    return {
      complete: false,
      progress: `Receiving image... (${entry.chunks.size}/${total} parts)`
    };
  }

  function renderChunkProgressCard(container, progressText, profile, rawToken) {
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
          ${escapeHtml(profile.name)}
        </span>
      </div>
      <div class="scaler-enc-chunk-progress">
        <span>⏳ ${escapeHtml(progressText)}</span>
      </div>
    `;
    container.appendChild(card);
  }

  // --- FULLSCREEN LIGHTBOX IMAGE VIEWER ---
  let activeLightbox = null;

  function openLightboxViewer(src, title, isGif) {
    if (activeLightbox) activeLightbox.remove();

    let zoomLevel = 1;
    let isDragging = false;
    let startX = 0, startY = 0;
    let translateX = 0, translateY = 0;

    const overlay = document.createElement('div');
    overlay.className = 'scaler-enc-lightbox-overlay';

    overlay.innerHTML = `
      <div class="scaler-enc-lightbox-header">
        <div class="scaler-enc-lightbox-title">
          <span>📷</span>
          <span>${escapeHtml(title || 'Encrypted Image Preview')}</span>
          ${isGif ? '<span class="scaler-enc-badge scaler-enc-badge-gif">GIF</span>' : ''}
        </div>
        <button class="scaler-enc-lightbox-close" id="scaler-lb-close" title="Close (Esc)">&times;</button>
      </div>
      <div class="scaler-enc-lightbox-body" id="scaler-lb-body">
        <img class="scaler-enc-lightbox-img" id="scaler-lb-img" src="${escapeHtml(src)}" alt="Preview" draggable="false" />
      </div>
      <div class="scaler-enc-lightbox-toolbar">
        <button class="scaler-enc-lightbox-btn" id="scaler-lb-zoom-in" title="Zoom In">🔍+ Zoom In</button>
        <button class="scaler-enc-lightbox-btn" id="scaler-lb-zoom-out" title="Zoom Out">🔍- Zoom Out</button>
        <button class="scaler-enc-lightbox-btn" id="scaler-lb-reset" title="Reset Zoom">↺ Reset</button>
        <button class="scaler-enc-lightbox-btn" id="scaler-lb-copy" title="Copy to Clipboard">📋 Copy</button>
        <button class="scaler-enc-lightbox-btn" id="scaler-lb-download" title="Download Image">📥 Download</button>
      </div>
    `;

    document.body.appendChild(overlay);
    activeLightbox = overlay;

    const imgEl = overlay.querySelector('#scaler-lb-img');
    const bodyEl = overlay.querySelector('#scaler-lb-body');

    function updateTransform() {
      imgEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
    }

    overlay.querySelector('#scaler-lb-zoom-in').addEventListener('click', () => {
      zoomLevel = Math.min(zoomLevel + 0.3, 4);
      updateTransform();
    });

    overlay.querySelector('#scaler-lb-zoom-out').addEventListener('click', () => {
      zoomLevel = Math.max(zoomLevel - 0.3, 0.4);
      updateTransform();
    });

    overlay.querySelector('#scaler-lb-reset').addEventListener('click', () => {
      zoomLevel = 1;
      translateX = 0;
      translateY = 0;
      updateTransform();
    });

    // Copy to clipboard
    overlay.querySelector('#scaler-lb-copy').addEventListener('click', async () => {
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        if (navigator.clipboard && window.ClipboardItem) {
          if (blob.type === 'image/png') {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            showToast('✅ Image copied to clipboard!');
          } else {
            const tempImg = new Image();
            tempImg.onload = async () => {
              const c = document.createElement('canvas');
              c.width = tempImg.naturalWidth;
              c.height = tempImg.naturalHeight;
              c.getContext('2d').drawImage(tempImg, 0, 0);
              c.toBlob(async (pngBlob) => {
                if (pngBlob) {
                  try {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
                    showToast('✅ Image copied to clipboard!');
                  } catch (e) {
                    showToast('⚠️ Clipboard copy restricted. Use Download.');
                  }
                }
              }, 'image/png');
            };
            tempImg.src = src;
          }
        } else {
          showToast('📋 Clipboard copy not supported. Click Download.');
        }
      } catch (err) {
        showToast('⚠️ Copy failed. Click Download instead.');
      }
    });

    // Download image
    overlay.querySelector('#scaler-lb-download').addEventListener('click', () => {
      const ext = isGif ? 'gif' : 'png';
      const a = document.createElement('a');
      a.href = src;
      a.download = `scaler-image-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('📥 Downloading image...');
    });

    // Pan / Drag support
    bodyEl.addEventListener('mousedown', (e) => {
      if (e.target === bodyEl || e.target === imgEl) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Mouse wheel zoom
    bodyEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomLevel = Math.min(zoomLevel + 0.15, 4);
      } else {
        zoomLevel = Math.max(zoomLevel - 0.15, 0.4);
      }
      updateTransform();
    }, { passive: false });

    function close() {
      overlay.remove();
      activeLightbox = null;
      document.removeEventListener('keydown', handleKey);
    }

    function handleKey(e) {
      if (e.key === 'Escape') close();
    }

    overlay.querySelector('#scaler-lb-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === bodyEl || e.target === overlay) close();
    });
    document.addEventListener('keydown', handleKey);
  }

  // --- RENDER DECRYPTED MESSAGES (TEXT / IMAGE / GIF) ---
  function renderCleanDecryptedCard(container, plaintext, profile, rawToken) {
    const pTags = container.querySelectorAll('p');
    pTags.forEach(p => {
      if (p.textContent.includes('🔒[ENC:v1:')) {
        p.style.display = 'none';
      }
    });

    // Check if plaintext is JSON image payload or chunk
    let mediaPayload = null;
    let isChunk = false;

    if (typeof plaintext === 'string' && plaintext.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(plaintext);
        if (parsed && parsed.v === 1 && (parsed.type === 'image' || parsed.type === 'image_chunk')) {
          mediaPayload = parsed;
          if (parsed.type === 'image_chunk') isChunk = true;
        }
      } catch (e) {}
    } else if (typeof plaintext === 'string' && plaintext.startsWith('data:image/')) {
      mediaPayload = {
        v: 1,
        type: 'image',
        src: plaintext,
        mime: plaintext.substring(5, plaintext.indexOf(';')),
        caption: '',
        animated: plaintext.startsWith('data:image/gif')
      };
    }

    if (isChunk) {
      const chunkResult = handleIncomingImageChunk(mediaPayload, profile, rawToken, container);
      if (!chunkResult.complete) {
        renderChunkProgressCard(container, chunkResult.progress, profile, rawToken);
        return;
      }
      mediaPayload = chunkResult.media;
    }

    const existing = container.querySelector('.scaler-enc-clean-msg, .scaler-enc-locked-msg');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.className = 'scaler-enc-clean-msg';

    let contentHtml = '';
    let isImageMsg = mediaPayload && mediaPayload.type === 'image';

    if (isImageMsg) {
      const isGif = !!mediaPayload.animated || (mediaPayload.mime && mediaPayload.mime.includes('gif')) || mediaPayload.src.startsWith('data:image/gif');
      const captionHtml = mediaPayload.caption ? `<div class="scaler-enc-image-caption">${formatPlaintext(mediaPayload.caption)}</div>` : '';
      const gifBadge = isGif ? '<span class="scaler-enc-gif-badge">GIF</span>' : '';

      contentHtml = `
        <div class="scaler-enc-thumb-wrapper" data-isgif="${isGif ? 'true' : 'false'}">
          ${gifBadge}
          <img class="scaler-enc-thumb-img" src="${escapeHtml(mediaPayload.src)}" alt="Encrypted Image" loading="lazy" />
          <div class="scaler-enc-thumb-overlay">🔍</div>
        </div>
        ${captionHtml}
      `;
    } else {
      contentHtml = `<div class="scaler-enc-content">${formatPlaintext(plaintext)}</div>`;
    }

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
      ${contentHtml}
      <div class="scaler-enc-raw-text" style="display: none;">${escapeHtml(rawToken)}</div>
    `;

    const rawToggle = card.querySelector('.scaler-enc-raw-toggle');
    const rawBox = card.querySelector('.scaler-enc-raw-text');
    rawToggle.addEventListener('click', () => {
      const isHidden = rawBox.style.display === 'none';
      rawBox.style.display = isHidden ? 'block' : 'none';
      rawToggle.textContent = isHidden ? 'hide raw' : 'raw';
    });

    if (isImageMsg) {
      const thumbWrapper = card.querySelector('.scaler-enc-thumb-wrapper');
      if (thumbWrapper) {
        thumbWrapper.addEventListener('click', () => {
          const isGif = thumbWrapper.dataset.isgif === 'true';
          openLightboxViewer(mediaPayload.src, mediaPayload.caption || profile.name + ' Image', isGif);
        });
      }
    }

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
          <input type="text" id="scaler-enc-new-name" class="scaler-enc-input" style="width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #fff; padding: 6px 9px; font-size: 12px; margin-bottom: 6px; box-sizing: border-box;" placeholder="Profile Name (e.g. SST, Study Group)...">
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
    injectStyles();
    setupLiveObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
