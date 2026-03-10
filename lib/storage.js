/**
 * Storage layer — settings (chrome.storage.local) + log folder handle (IndexedDB).
 * FileSystemDirectoryHandle cannot be stored in chrome.storage, so IndexedDB is used.
 */

// ── IndexedDB for FileSystemDirectoryHandle ───────────────────────────────────

const DB_NAME = 'zpl-preview-db';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const DIR_HANDLE_KEY = 'logDirHandle';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function saveDirHandle(handle) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(handle, DIR_HANDLE_KEY);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

export async function getDirHandle() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(DIR_HANDLE_KEY);
    req.onsuccess = (e) => resolve(e.target.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function clearDirHandle() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(DIR_HANDLE_KEY);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  dpmm: 8,
  width: 4,
  height: 6,
  format: 'png',
  pollIntervalSeconds: 2,
  autoDownload: false,
  downloadSubfolder: 'ZPL Labels',
  debugMode: false,
  popupPreviewEnabled: false,
  popupPreviewDuration: 5,
  carouselView: false,
  soundEnabled: false,
  osNotificationsEnabled: false,
};

export async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings: { ...DEFAULT_SETTINGS, ...settings } }, resolve);
  });
}

export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings', (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...(result.settings || {}) });
    });
  });
}

/**
 * Build today's log filename: notifier-YYYYMMDD.log
 */
export function todayLogFilename(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `notifier-${y}${m}${d}.log`;
}
