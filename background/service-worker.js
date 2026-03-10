/**
 * Background service worker.
 * Reads today's log file directly via the File System Access API
 * (FileSystemDirectoryHandle stored in IndexedDB), extracts ZPL,
 * and renders labels via labelary.com.
 */

import { getSettings, getDirHandle, todayLogFilename } from '../lib/storage.js';
import { extractZplBlocks, getNewContent } from '../lib/zpl-parser.js';
import { renderLabel, blobToDataUrl } from '../lib/labelary.js';

const ALARM_NAME = 'poll-log-file';
const POLL_OFFSET_KEY = 'pollOffset';
const POLL_DATE_KEY = 'pollDate';

// ── Alarm registration ────────────────────────────────────────────────────────

async function registerAlarm() {
  await chrome.alarms.clear(ALARM_NAME);
  // Chrome enforces a minimum of 0.5 minutes (30s) for alarms in MV3.
  // We use 0.5 as the floor so the alarm fires as frequently as allowed.
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 0.5 });
}

// ── Core polling logic ────────────────────────────────────────────────────────

async function pollLogFile() {
  const settings = await getSettings();
  const filename = todayLogFilename();

  // Detect day rollover — reset offset when date changes
  const today = new Date().toDateString();
  const sessionData = await chrome.storage.session.get([POLL_OFFSET_KEY, POLL_DATE_KEY]);
  const lastDate = sessionData[POLL_DATE_KEY];
  const lastOffset = lastDate === today ? (sessionData[POLL_OFFSET_KEY] || 0) : 0;

  // ── Method A: File System Access API (Windows / non-system paths) ────────────
  let text;
  const dirHandle = await getDirHandle();
  if (dirHandle) {
    const permission = await dirHandle.queryPermission({ mode: 'read' }).catch(() => 'prompt');
    if (permission === 'granted') {
      try {
        const fileHandle = await dirHandle.getFileHandle(filename);
        const file = await fileHandle.getFile();
        text = await file.text();
      } catch (err) {
        if (err.name === 'NotFoundError') {
          // File not found via filesystem — fall through to server method
        }
        // Any other error: fall through to server method
      }
    }
  }

  // ── Method B: HTTP server fallback (required for Mac ~/Library paths) ────────
  if (text === undefined) {
    const port = settings.serverPort;
    if (!port) {
      await chrome.storage.session.set({
        pollError: 'No log source configured. Open Settings to select a folder or start the file server.',
      });
      return;
    }
    const url = `http://localhost:${port}/${filename}`;
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        await chrome.storage.session.set({
          pollError: `Log file not found (${filename}). Is the server running on port ${port}?`,
          watchFilename: filename,
        });
        return;
      }
      text = await response.text();
    } catch {
      await chrome.storage.session.set({
        pollError: `Cannot reach localhost:${port}. Run the server command shown in Settings.`,
      });
      return;
    }
  }

  const { newContent, newOffset } = getNewContent(text, lastOffset);

  await chrome.storage.session.set({
    [POLL_OFFSET_KEY]: newOffset,
    [POLL_DATE_KEY]: today,
    pollError: null,
    watchFilename: filename,
  });

  if (!newContent.trim()) return;

  let zplEntries = extractZplBlocks(newContent);
  if (zplEntries.length === 0) {
    if (settings.debugMode) {
      await chrome.storage.session.set({ debugRawTail: newContent.slice(-2000), debugZplCount: 0 });
    }
    return;
  }

  // On first load (lastOffset === 0) the entire file is "new" — cap at 5 most recent
  // to avoid hammering the labelary API with the full day's history.
  if (lastOffset === 0 && zplEntries.length > 5) {
    zplEntries = zplEntries.slice(-5);
  }

  if (settings.debugMode) {
    await chrome.storage.session.set({
      debugRawTail: newContent.slice(-2000),
      debugZplCount: zplEntries.length,
    });
  }

  const renderedLabels = [];
  for (const { zpl, logTimestamp } of zplEntries) {
    try {
      const blob = await renderLabel(zpl, settings);
      const dataUrl = await blobToDataUrl(blob);
      renderedLabels.push({
        zpl,
        dataUrl,
        mimeType: blob.type,
        logTimestamp,
        capturedAt: Date.now(),
        width: settings.width,
        height: settings.height,
        format: settings.format,
      });
      // Small delay between renders to stay within labelary rate limits
      if (zplEntries.length > 1) await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.error('Labelary render failed:', err);
    }
  }

  if (renderedLabels.length === 0) return;

  // Newest labels first, keep last 100
  const existing = await chrome.storage.local.get('labels');
  const history  = existing.labels || [];
  const updated  = [...renderedLabels.reverse(), ...history].slice(0, 100);
  await chrome.storage.local.set({ labels: updated, currentIndex: 0 });

  // Badge: show count of newly added labels
  const n = renderedLabels.length;
  chrome.action.setBadgeText({ text: n > 99 ? '99+' : String(n) });
  chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });

  if (settings.autoDownload) {
    for (const label of renderedLabels) triggerDownload(label);
  }

  if (settings.osNotificationsEnabled) {
    const label = renderedLabels[0];
    chrome.notifications.create(`label-${Date.now()}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: `New Label Detected${n > 1 ? ` (${n})` : ''}`,
      message: `${label.width}"×${label.height}" ${label.format.toUpperCase()} label ready`,
      silent: true,
    });
  }

  if (settings.popupPreviewEnabled) {
    await showPreviewWindow(renderedLabels[0], settings);
  }
}

async function showPreviewWindow(label, settings) {
  // Store the label for the preview page to read
  await chrome.storage.session.set({ previewLabel: label });

  // Close any existing preview window
  const { previewWindowId } = await chrome.storage.session.get('previewWindowId');
  if (previewWindowId) {
    try { await chrome.windows.remove(previewWindowId); } catch {}
  }

  // Size the window to roughly match the label dimensions
  const pxPerInch = 96;
  const winWidth = Math.max(320, Math.round(label.width * pxPerInch) + 40);
  const winHeight = Math.max(300, Math.round(label.height * pxPerInch) + 90);

  const win = await chrome.windows.create({
    url: chrome.runtime.getURL('preview/preview.html'),
    type: 'popup',
    width: winWidth,
    height: winHeight,
    focused: true,
  });

  await chrome.storage.session.set({ previewWindowId: win.id });
}

async function triggerDownload(label) {
  const settings = await getSettings();
  const ext = label.format === 'jpg' ? 'jpg' : label.format === 'pdf' ? 'pdf' : 'png';
  const ts = (label.logTimestamp || '').replace(/[/ :]/g, '-');
  const subfolder = (settings.downloadSubfolder || '').trim();
  const filename = subfolder ? `${subfolder}/label-${ts}.${ext}` : `label-${ts}.${ext}`;
  chrome.downloads.download({ url: label.dataUrl, filename, saveAs: false });
}

// ── Message handling ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'REGISTER_ALARM') {
    registerAlarm().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === 'RESET_OFFSET') {
    chrome.storage.session.set({ [POLL_OFFSET_KEY]: 0, [POLL_DATE_KEY]: null })
      .then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === 'POLL_NOW') {
    pollLogFile()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => registerAlarm());
chrome.runtime.onStartup.addListener(() => registerAlarm());
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) pollLogFile();
});
