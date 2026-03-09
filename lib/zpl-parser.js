/**
 * ZPL parsing utilities.
 * Extracts ZPL data from log lines in the format:
 *   2026/03/09 12:39:25 cid=<value> printer=<name> data=<ZPL> printCmdOutput=
 */

// Captures: [1] timestamp, [2] ZPL payload
const LOG_LINE_REGEX = /(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}).*?\bdata=(\^XA.+?)\s+printCmdOutput=/g;

/**
 * Extract all ZPL payloads from log content.
 * @param {string} content - Raw log file content
 * @returns {{ zpl: string, logTimestamp: string }[]}
 */
export function extractZplBlocks(content) {
  if (!content || typeof content !== 'string') return [];
  const results = [];
  let match;
  LOG_LINE_REGEX.lastIndex = 0;
  while ((match = LOG_LINE_REGEX.exec(content)) !== null) {
    results.push({ zpl: match[2], logTimestamp: match[1] });
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
