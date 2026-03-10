/**
 * ZPL parsing utilities.
 *
 * Log format (Mac and Windows):
 *   2026/03/10 07:54:40 printer=<name> data=^XA...^XZ[^MCY] [printCmdOutput=]
 *
 * Each line may contain multiple concatenated ^XA...^XZ blocks.
 * Trivial reset blocks (e.g. ^XA^MCY^XZ) are filtered out.
 */

// Match a log line: capture [1] timestamp, [2] everything after "data=" to end of line.
// Works regardless of whether printCmdOutput= is present (Mac) or absent (Windows).
const LOG_LINE_REGEX = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})[^\n]*?\bdata=([^\n]+)/gm;

// Extract individual ^XA...^XZ blocks from a data field string.
const ZPL_BLOCK_REGEX = /\^XA[\s\S]*?\^XZ/gi;

/**
 * Extract all ZPL payloads from log content.
 * @param {string} content - Raw log file content
 * @returns {{ zpl: string, logTimestamp: string }[]}
 */
export function extractZplBlocks(content) {
  if (!content || typeof content !== 'string') return [];
  const results = [];
  let lineMatch;
  LOG_LINE_REGEX.lastIndex = 0;
  while ((lineMatch = LOG_LINE_REGEX.exec(content)) !== null) {
    const logTimestamp = lineMatch[1];
    const dataField = lineMatch[2];
    ZPL_BLOCK_REGEX.lastIndex = 0;
    let blockMatch;
    while ((blockMatch = ZPL_BLOCK_REGEX.exec(dataField)) !== null) {
      const zpl = blockMatch[0].trim();
      // Skip trivial reset/init blocks (e.g. ^XA^MCY^XZ) that have no real content.
      // A real label block contains at least one field (^F) or barcode (^B) command.
      if (!/\^[BF][A-Z0-9]/i.test(zpl)) continue;
      results.push({ zpl, logTimestamp });
    }
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
