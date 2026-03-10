/**
 * ZPL parsing utilities.
 * Extracts ZPL data from log lines in the format:
 *   2026/03/09 12:39:25 cid=<value> printer=<name> data=<ZPL> printCmdOutput=
 *
 * Falls back to scanning for bare ^XA...^XZ blocks (case-insensitive) when the
 * structured log format doesn't match (e.g. different Windows log layouts).
 */

// Primary: structured log line — captures [1] timestamp, [2] ZPL payload.
// Uses 's' (dotAll) flag so multi-line ZPL embedded in a log line is captured.
const LOG_LINE_REGEX = /(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}).*?\bdata=(\^XA.+?)\s+printCmdOutput=/gis;

// Fallback: bare ^XA...^XZ blocks anywhere in the content (case-insensitive, dotAll).
const ZPL_BLOCK_REGEX = /(\^XA[\s\S]*?\^XZ)/gi;

// Timestamp on its own line just before or near a ZPL block (best-effort).
const TIMESTAMP_REGEX = /(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/;

/**
 * Extract all ZPL payloads from log content.
 * @param {string} content - Raw log file content
 * @returns {{ zpl: string, logTimestamp: string }[]}
 */
export function extractZplBlocks(content) {
  if (!content || typeof content !== 'string') return [];
  const results = [];

  // Try primary structured format first.
  LOG_LINE_REGEX.lastIndex = 0;
  let match;
  while ((match = LOG_LINE_REGEX.exec(content)) !== null) {
    results.push({ zpl: match[2].trim(), logTimestamp: match[1] });
  }

  if (results.length > 0) return results;

  // Fallback: find any ^XA...^XZ block; pull the nearest preceding timestamp.
  ZPL_BLOCK_REGEX.lastIndex = 0;
  while ((match = ZPL_BLOCK_REGEX.exec(content)) !== null) {
    const before = content.slice(0, match.index);
    const tsMatch = before.match(/(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})(?!.*\d{4}\/\d{2}\/\d{2})/s);
    const logTimestamp = tsMatch ? tsMatch[1] : new Date().toISOString().slice(0, 19).replace('T', ' ');
    results.push({ zpl: match[1].trim(), logTimestamp });
  }

  return results;
}

/**
 * Given the full current file content and the last known byte offset,
 * return only the newly added content since the last poll.
 * @param {string} fullContent - Entire file text
 * @param {number} lastOffset - Character offset from the previous read (0 for first read)
 * @returns {{ newContent: string, newOffset: number }}
 */
export function getNewContent(fullContent, lastOffset) {
  if (!fullContent) return { newContent: '', newOffset: 0 };
  const newContent = fullContent.slice(lastOffset);
  return { newContent, newOffset: fullContent.length };
}
