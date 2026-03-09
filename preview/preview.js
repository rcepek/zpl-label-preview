(async () => {
  const { previewLabel, settings } = await chrome.storage.local.get(['settings']);
  const { previewLabel: label } = await chrome.storage.session.get('previewLabel');

  if (!label) { window.close(); return; }

  const duration = (settings?.popupPreviewDuration ?? 5);

  // Populate UI
  const img = document.getElementById('label-img');
  const pdfPlaceholder = document.getElementById('pdf-placeholder');
  const labelInfo = document.getElementById('label-info');

  if (label.format === 'pdf') {
    pdfPlaceholder.style.display = 'flex';
  } else {
    img.src = label.dataUrl;
    img.style.display = 'block';
  }

  const ts = label.logTimestamp || new Date(label.capturedAt).toLocaleString();
  labelInfo.textContent = `${label.width}"×${label.height}" · ${label.format.toUpperCase()} · ${ts}`;

  // Countdown + progress bar
  const secondsEl = document.getElementById('seconds');
  const progressBar = document.getElementById('progress-bar');

  secondsEl.textContent = duration;
  // Animate progress bar shrinking to 0 over the full duration
  progressBar.style.transition = `width ${duration}s linear`;
  // Trigger reflow so the transition fires
  progressBar.getBoundingClientRect();
  progressBar.style.width = '0%';

  let remaining = duration;
  const tick = setInterval(() => {
    remaining--;
    secondsEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(tick);
      window.close();
    }
  }, 1000);

  document.getElementById('btn-close').addEventListener('click', () => {
    clearInterval(tick);
    window.close();
  });
})();
