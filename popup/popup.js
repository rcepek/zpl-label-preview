import { getSettings, todayLogFilename } from '../lib/storage.js';

let labels = [];
let currentIndex = 0;
let settings = {};
let rotation = 0;
let zoom = 1;

// Lazy AudioContext — created on first user interaction to satisfy browser autoplay policy
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

const states = {
  onboarding: document.getElementById('state-onboarding'),
  watching:   document.getElementById('state-watching'),
  label:      document.getElementById('state-label'),
  error:      document.getElementById('state-error'),
};

function showState(name) {
  Object.values(states).forEach((el) => el.classList.add('hidden'));
  states[name].classList.remove('hidden');
}

// ── Transform helpers ─────────────────────────────────────────────────────────

function updateTransform() {
  const img = document.getElementById('label-img');
  const parts = [];
  if (rotation !== 0) parts.push(`rotate(${rotation}deg)`);
  if (zoom !== 1)     parts.push(`scale(${zoom.toFixed(2)})`);
  img.style.transform = parts.join(' ');
}

function applyRotation() {
  const img  = document.getElementById('label-img');
  const wrap = document.getElementById('label-image-wrap');
  const sideways = rotation === 90 || rotation === 270;

  document.getElementById('rotate-deg').textContent = `${rotation}°`;

  if (sideways) {
    const available = wrap.clientWidth - 24;
    img.style.maxWidth  = 'none';
    img.style.maxHeight = (available > 0 ? available : 280) + 'px';
    const nat = img.naturalWidth && img.naturalHeight
      ? img.naturalWidth / img.naturalHeight : 0.667;
    wrap.style.minHeight = Math.round((available > 0 ? available : 280) * nat + 24) + 'px';
  } else {
    img.style.maxWidth  = '100%';
    img.style.maxHeight = '480px';
    img.style.width     = 'auto';
    wrap.style.minHeight = '';
  }

  updateTransform();
}

function resetZoom() {
  zoom = 1;
  document.getElementById('zoom-hint').textContent = '';
  updateTransform();
}

function saveRotationIfPersist() {
  if (document.getElementById('chk-persist-rotation').checked) {
    chrome.storage.local.set({ uiSavedRotation: rotation });
  }
}

// ── Sound chime ───────────────────────────────────────────────────────────────

function playChime() {
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch {}
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  chrome.action.setBadgeText({ text: '' });

  const [storedSettings, localData, sessionData] = await Promise.all([
    getSettings(),
    chrome.storage.local.get(['labels', 'currentIndex', 'uiPersistRotation', 'uiSavedRotation']),
    chrome.storage.session.get(['pollError', 'watchFilename']),
  ]);

  settings     = storedSettings;
  labels       = localData.labels || [];
  currentIndex = localData.currentIndex || 0;

  const persistRotation = localData.uiPersistRotation || false;
  document.getElementById('chk-persist-rotation').checked = persistRotation;
  rotation = persistRotation ? (localData.uiSavedRotation || 0) : 0;

  if (sessionData.pollError) { showError(sessionData.pollError); return; }

  if (labels.length === 0) {
    const filename = sessionData.watchFilename || todayLogFilename();
    document.getElementById('watch-filename').textContent =
      `localhost:${settings.serverPort}/${filename}`;
    showState('watching');
    return;
  }

  renderLabelView();
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderLabelView() {
  showState('label');

  if (!document.getElementById('chk-persist-rotation').checked) rotation = 0;
  zoom = 1;

  const label  = labels[currentIndex];
  const isPdf  = label.format === 'pdf';
  const imgWrap        = document.getElementById('label-image-wrap');
  const pdfPlaceholder = document.getElementById('pdf-placeholder');
  const rotateControls = document.getElementById('rotate-controls');

  if (isPdf) {
    imgWrap.classList.add('hidden');
    pdfPlaceholder.classList.remove('hidden');
    rotateControls.classList.add('hidden');
  } else {
    imgWrap.classList.remove('hidden');
    pdfPlaceholder.classList.add('hidden');
    rotateControls.classList.remove('hidden');
    const img = document.getElementById('label-img');
    img.src = label.dataUrl;
    img.onload = () => applyRotation();
    applyRotation();
  }

  const ts = label.logTimestamp || new Date(label.capturedAt).toLocaleString();
  document.getElementById('label-info').textContent =
    `${label.width}"×${label.height}" · ${label.format.toUpperCase()} · ${ts}`;

  renderNavigation();

  const debugSection = document.getElementById('debug-section');
  if (settings.debugMode) {
    debugSection.classList.remove('hidden');
    chrome.storage.session.get(['debugRawTail', 'debugZplCount']).then((d) => {
      document.getElementById('debug-raw').textContent = d.debugRawTail || '(none)';
      document.getElementById('debug-zpl').textContent =
        `${d.debugZplCount || 0} ZPL block(s) detected in last scan.\n\nCurrent label ZPL:\n${label.zpl || '(not stored)'}`;
    });
  } else {
    debugSection.classList.add('hidden');
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────

function renderNavigation() {
  const carousel   = document.getElementById('label-carousel');
  const pagination = document.getElementById('pagination');

  if (labels.length <= 1) {
    carousel.classList.add('hidden');
    pagination.classList.add('hidden');
    return;
  }

  if (settings.carouselView) {
    pagination.classList.add('hidden');
    carousel.classList.remove('hidden');
    renderCarousel();
  } else {
    carousel.classList.add('hidden');
    pagination.classList.remove('hidden');
    document.getElementById('page-counter').textContent = `${currentIndex + 1} of ${labels.length}`;
    document.getElementById('btn-prev').disabled = currentIndex === 0;
    document.getElementById('btn-next').disabled = currentIndex === labels.length - 1;
  }
}

function renderCarousel() {
  const carousel = document.getElementById('label-carousel');
  carousel.innerHTML = '';

  let lastDateStr = null;

  labels.forEach((lbl, i) => {
    // Date separator
    const dateStr = new Date(lbl.capturedAt).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric',
    });
    if (dateStr !== lastDateStr) {
      const sep = document.createElement('div');
      sep.className = 'carousel-date-sep';
      sep.textContent = dateStr;
      carousel.appendChild(sep);
      lastDateStr = dateStr;
    }

    const thumb = document.createElement('div');
    thumb.className = 'carousel-thumb' + (i === currentIndex ? ' active' : '');

    if (lbl.format === 'pdf') {
      thumb.innerHTML = '<span class="pdf-thumb">📄</span>';
    } else {
      const img = document.createElement('img');
      img.src = lbl.dataUrl;
      img.alt = `Label ${i + 1}`;
      thumb.appendChild(img);
    }

    thumb.addEventListener('click', () => {
      currentIndex = i;
      chrome.storage.local.set({ currentIndex });
      renderLabelView();
    });

    carousel.appendChild(thumb);
  });

  const activeThumb = carousel.querySelector('.carousel-thumb.active');
  if (activeThumb) activeThumb.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

// ── Error ─────────────────────────────────────────────────────────────────────

function showError(msg) {
  document.getElementById('error-msg').textContent = msg;
  showState('error');
}

// ── Settings ──────────────────────────────────────────────────────────────────

function openSettings() { chrome.runtime.openOptionsPage(); }

// ── Event listeners ───────────────────────────────────────────────────────────

// Warm up AudioContext on first click (satisfies autoplay policy)
document.addEventListener('click', () => getAudioCtx(), { once: true });

document.getElementById('btn-open-settings').addEventListener('click', openSettings);
document.getElementById('btn-settings').addEventListener('click', (e) => {
  e.preventDefault();
  openSettings();
});
document.getElementById('btn-open-settings-error')?.addEventListener('click', openSettings);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'ArrowLeft')  document.getElementById('btn-prev').click();
  if (e.key === 'ArrowRight') document.getElementById('btn-next').click();
  if (e.key === 'r' || e.key === 'R') document.getElementById('btn-rotate').click();
  if (e.key === 'z' || e.key === 'Z') resetZoom();
});

// Scroll to zoom
document.getElementById('label-image-wrap').addEventListener('wheel', (e) => {
  if (!document.getElementById('label-img').src) return;
  e.preventDefault();
  zoom = Math.max(0.5, Math.min(4, zoom + (e.deltaY > 0 ? -0.12 : 0.12)));
  document.getElementById('zoom-hint').textContent = zoom !== 1 ? `${Math.round(zoom * 100)}%` : '';
  updateTransform();
}, { passive: false });

document.getElementById('btn-prev').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    chrome.storage.local.set({ currentIndex });
    renderLabelView();
  }
});

document.getElementById('btn-next').addEventListener('click', () => {
  if (currentIndex < labels.length - 1) {
    currentIndex++;
    chrome.storage.local.set({ currentIndex });
    renderLabelView();
  }
});

document.getElementById('btn-rotate').addEventListener('click', () => {
  rotation = (rotation + 90) % 360;
  applyRotation();
  saveRotationIfPersist();
});

document.getElementById('chk-persist-rotation').addEventListener('change', (e) => {
  chrome.storage.local.set({ uiPersistRotation: e.target.checked });
  if (e.target.checked) {
    chrome.storage.local.set({ uiSavedRotation: rotation });
  } else {
    rotation = 0;
    chrome.storage.local.set({ uiSavedRotation: 0 });
    applyRotation();
  }
});

document.getElementById('btn-copy-zpl').addEventListener('click', async () => {
  const label = labels[currentIndex];
  if (!label?.zpl) return;
  try {
    await navigator.clipboard.writeText(label.zpl);
    const btn = document.getElementById('btn-copy-zpl');
    btn.textContent = '✅';
    setTimeout(() => { btn.textContent = '📋'; }, 1500);
  } catch {}
});

document.getElementById('btn-clear-history').addEventListener('click', async () => {
  if (!confirm(`Clear all ${labels.length} label(s) from history?`)) return;
  await chrome.storage.local.set({ labels: [], currentIndex: 0 });
  labels = [];
  currentIndex = 0;
  chrome.action.setBadgeText({ text: '' });
  const sessionData = await chrome.storage.session.get('watchFilename');
  const filename = sessionData.watchFilename || todayLogFilename();
  document.getElementById('watch-filename').textContent =
    `localhost:${settings.serverPort}/${filename}`;
  showState('watching');
});

document.getElementById('btn-download').addEventListener('click', async () => {
  const label = labels[currentIndex];
  if (!label) return;
  const ext = label.format === 'jpg' ? 'jpg' : label.format === 'pdf' ? 'pdf' : 'png';
  const ts = (label.logTimestamp || '').replace(/[/ :]/g, '-');
  const subfolder = (settings.downloadSubfolder || '').trim();
  const filename = subfolder ? `${subfolder}/label-${ts}.${ext}` : `label-${ts}.${ext}`;
  chrome.downloads.download({ url: label.dataUrl, filename, saveAs: true });
});

document.getElementById('btn-open-full').addEventListener('click', () => {
  const label = labels[currentIndex];
  if (!label) return;
  chrome.tabs.create({ url: label.dataUrl });
});

document.getElementById('label-img').addEventListener('click', () => {
  const label = labels[currentIndex];
  if (label) chrome.tabs.create({ url: label.dataUrl });
});

// ── Live updates from service worker ─────────────────────────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.labels) {
    const newLabels = changes.labels.newValue || [];
    const isNew = newLabels.length > 0 && newLabels.length > labels.length;
    labels = newLabels;
    currentIndex = 0;
    if (labels.length > 0) {
      renderLabelView();
      if (isNew && settings.soundEnabled) playChime();
    }
  }
  if (area === 'session' && changes.pollError?.newValue) {
    showError(changes.pollError.newValue);
  }
});

// Trigger immediate poll, then keep polling every 3s while popup is open.
chrome.runtime.sendMessage({ type: 'POLL_NOW' });
const pollInterval = setInterval(() => {
  chrome.runtime.sendMessage({ type: 'POLL_NOW' });
}, 3000);
window.addEventListener('unload', () => clearInterval(pollInterval));

init();
