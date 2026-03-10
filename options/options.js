import { saveSettings, getSettings, todayLogFilename } from '../lib/storage.js';

const elServerPort = document.getElementById('server-port');
const elBtnTestServer = document.getElementById('btn-test-server');
const elTestStatus = document.getElementById('test-status');
const elBtnResetOffset = document.getElementById('btn-reset-offset');
const elLogDirMac = document.getElementById('log-dir-mac');
const elLogDirWindows = document.getElementById('log-dir-windows');
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

  elServerPort.value = settings.serverPort;
  elLogDirMac.value = settings.logDirMac || '~/Library/Logs/PlexComponentHost';
  elLogDirWindows.value = settings.logDirWindows || '%LOCALAPPDATA%\\Plex\\ComponentHost\\logs';
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

  // Update command blocks to reflect current port
  updateCmdBlocks(settings.serverPort);
}

function updateCmdBlocks(port) {
  const mac = elLogDirMac.value.trim() || '~/Library/Logs/PlexComponentHost';
  const win = elLogDirWindows.value.trim() || '%LOCALAPPDATA%\\Plex\\ComponentHost\\logs';
  document.getElementById('cmd-mac').textContent =
    `python3 -m http.server ${port} --directory ${mac}`;
  document.getElementById('cmd-windows').textContent =
    `python -m http.server ${port} --directory "${win}"`;
}

elServerPort.addEventListener('input', () => {
  updateCmdBlocks(elServerPort.value || 8765);
});

elLogDirMac.addEventListener('input', () => {
  updateCmdBlocks(elServerPort.value || 8765);
});

elLogDirWindows.addEventListener('input', () => {
  updateCmdBlocks(elServerPort.value || 8765);
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
  });
});

// Copy buttons
document.querySelectorAll('.btn-copy').forEach((btn) => {
  btn.addEventListener('click', () => {
    const text = document.getElementById(btn.dataset.target).textContent;
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    });
  });
});

// Test connection
elBtnTestServer.addEventListener('click', async () => {
  const port = parseInt(elServerPort.value, 10) || 8765;
  const filename = todayLogFilename();
  elTestStatus.textContent = 'Testing…';
  elTestStatus.className = 'test-status';
  try {
    const res = await fetch(`http://localhost:${port}/${filename}`);
    if (res.ok) {
      elTestStatus.textContent = `Connected — ${filename} found`;
      elTestStatus.className = 'test-status ok';
    } else {
      elTestStatus.textContent = `Server reachable but ${filename} not found (${res.status})`;
      elTestStatus.className = 'test-status error';
    }
  } catch {
    elTestStatus.textContent = `Cannot reach localhost:${port} — is the server running?`;
    elTestStatus.className = 'test-status error';
  }
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
    serverPort: parseInt(elServerPort.value, 10) || 8765,
    dpmm,
    width: parseFloat(elWidth.value) || 4,
    height: parseFloat(elHeight.value) || 6,
    format,
    pollIntervalSeconds: parseInt(elPollInterval.value, 10) || 2,
    logDirMac: elLogDirMac.value.trim(),
    logDirWindows: elLogDirWindows.value.trim(),
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
