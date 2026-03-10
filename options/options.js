import { saveSettings, getSettings, saveDirHandle, getDirHandle, clearDirHandle } from '../lib/storage.js';

const elBtnSelectFolder = document.getElementById('btn-select-folder');
const elBtnClearFolder = document.getElementById('btn-clear-folder');
const elSelectedFolder = document.getElementById('selected-folder');
const elBtnResetOffset = document.getElementById('btn-reset-offset');
const elWidth = document.getElementById('label-width');
const elHeight = document.getElementById('label-height');
const elPollInterval = document.getElementById('poll-interval');
const elDownloadSubfolder = document.getElementById('download-subfolder');
const elAutoDownload = document.getElementById('auto-download');
const elDebugMode = document.getElementById('debug-mode');
const elPopupPreviewEnabled = document.getElementById('popup-preview-enabled');
const elPopupPreviewDuration = document.getElementById('popup-preview-duration');
const elCarouselView = document.getElementById('carousel-view');
const elSoundEnabled = document.getElementById('sound-enabled');
const elOsNotificationsEnabled = document.getElementById('os-notifications-enabled');
const elBtnSave = document.getElementById('btn-save');
const elSaveStatus = document.getElementById('save-status');

async function init() {
  const settings = await getSettings();

  elWidth.value = settings.width;
  elHeight.value = settings.height;
  document.querySelector(`input[name="dpmm"][value="${settings.dpmm}"]`).checked = true;
  document.querySelector(`input[name="format"][value="${settings.format}"]`).checked = true;
  elPollInterval.value = settings.pollIntervalSeconds;
  elDownloadSubfolder.value = settings.downloadSubfolder ?? 'ZPL Labels';
  elAutoDownload.checked = settings.autoDownload;
  elDebugMode.checked = settings.debugMode;
  elPopupPreviewEnabled.checked = settings.popupPreviewEnabled;
  elPopupPreviewDuration.value = settings.popupPreviewDuration ?? 5;
  elCarouselView.checked = settings.carouselView;
  elSoundEnabled.checked = settings.soundEnabled;
  elOsNotificationsEnabled.checked = settings.osNotificationsEnabled;

  // Show the currently stored folder (if any)
  const dirHandle = await getDirHandle();
  await updateFolderDisplay(dirHandle);
}

async function updateFolderDisplay(dirHandle) {
  if (!dirHandle) {
    elSelectedFolder.textContent = 'No folder selected.';
    elSelectedFolder.className = 'selected-folder';
    return;
  }

  // Check current permission state
  let permission;
  try {
    permission = await dirHandle.queryPermission({ mode: 'read' });
  } catch {
    permission = 'unknown';
  }

  if (permission === 'granted') {
    elSelectedFolder.textContent = `Selected: ${dirHandle.name}`;
    elSelectedFolder.className = 'selected-folder ok';
  } else {
    elSelectedFolder.textContent = `${dirHandle.name} — permission required. Click "Select Log Folder…" to re-grant access.`;
    elSelectedFolder.className = 'selected-folder error';
  }
}

// Folder picker
elBtnSelectFolder.addEventListener('click', async () => {
  try {
    const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
    await saveDirHandle(dirHandle);
    await updateFolderDisplay(dirHandle);
    // Clear any stale poll error and trigger an immediate poll
    chrome.storage.session.set({ pollError: null });
    chrome.runtime.sendMessage({ type: 'POLL_NOW' });
  } catch (err) {
    if (err.name !== 'AbortError') {
      elSelectedFolder.textContent = `Error: ${err.message}`;
      elSelectedFolder.className = 'selected-folder error';
    }
  }
});

elBtnClearFolder.addEventListener('click', async () => {
  await clearDirHandle();
  updateFolderDisplay(null);
});

elBtnResetOffset.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'RESET_OFFSET' }, () => {
    showStatus("Will re-process today's file from the beginning on next poll.", false);
  });
});

elBtnSave.addEventListener('click', async () => {
  const dpmm = parseInt(document.querySelector('input[name="dpmm"]:checked')?.value || '8', 10);
  const format = document.querySelector('input[name="format"]:checked')?.value || 'png';

  const settings = {
    dpmm,
    width: parseFloat(elWidth.value) || 4,
    height: parseFloat(elHeight.value) || 6,
    format,
    pollIntervalSeconds: parseInt(elPollInterval.value, 10) || 2,
    downloadSubfolder: elDownloadSubfolder.value.trim(),
    autoDownload: elAutoDownload.checked,
    debugMode: elDebugMode.checked,
    popupPreviewEnabled: elPopupPreviewEnabled.checked,
    popupPreviewDuration: parseInt(elPopupPreviewDuration.value, 10) || 5,
    carouselView: elCarouselView.checked,
    soundEnabled: elSoundEnabled.checked,
    osNotificationsEnabled: elOsNotificationsEnabled.checked,
  };

  await saveSettings(settings);
  chrome.runtime.sendMessage({ type: 'REGISTER_ALARM' });
  showStatus('Settings saved.', false);
});

function showStatus(msg, isError) {
  elSaveStatus.textContent = msg;
  elSaveStatus.className = 'save-status' + (isError ? ' error' : '');
  setTimeout(() => { elSaveStatus.textContent = ''; }, 3000);
}

init();
