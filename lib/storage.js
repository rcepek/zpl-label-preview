/**
 * Storage layer — settings only, via chrome.storage.local.
 */

const DEFAULT_SETTINGS = {
  serverPort: 8765,
  logDirMac: '~/Library/Logs/PlexComponentHost',
  logDirWindows: '%LOCALAPPDATA%\\Plex\\ComponentHost\\logs',
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
