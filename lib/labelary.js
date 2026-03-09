/**
 * Labelary.com API wrapper.
 * Renders ZPL to PNG, JPG, or PDF.
 */

const LABELARY_BASE = 'https://api.labelary.com/v1/printers';

const ACCEPT_HEADERS = {
  png: 'image/png',
  jpg: 'image/jpeg',
  pdf: 'application/pdf',
};

/**
 * Render a ZPL string to an image or PDF via the labelary.com API.
 * @param {string} zpl - Raw ZPL string (^XA...^XZ)
 * @param {{ dpmm: number, width: number, height: number, format: 'png'|'jpg'|'pdf' }} options
 * @returns {Promise<{ blob: Blob, objectUrl: string }>}
 */
export async function renderLabel(zpl, { dpmm = 8, width = 4, height = 6, format = 'png' } = {}) {
  const url = `${LABELARY_BASE}/${dpmm}dpmm/labels/${width}x${height}/0/`;
  const accept = ACCEPT_HEADERS[format] || ACCEPT_HEADERS.png;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': accept,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: zpl,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Labelary API error ${response.status}: ${text}`);
  }

  const blob = await response.blob();
  return blob;
}

/**
 * Convert a Blob to a base64 data URL for storage in chrome.storage.local.
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
