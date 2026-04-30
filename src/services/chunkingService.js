// backend/src/services/chunkingService.js
// Splits text into overlapping chunks with metadata

const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Split text into overlapping chunks.
 *
 * WHY these defaults?
 * - chunkSize 800: Balances between having enough context per chunk for the LLM
 *   to produce meaningful answers, and keeping embeddings focused on a single topic.
 *   700-900 is the sweet spot — smaller chunks lose context, larger chunks dilute
 *   the embedding signal and waste LLM context window.
 * - overlap 200: 25% overlap ensures that information near chunk boundaries is not
 *   lost. If a key sentence spans two chunks, the overlap captures it in both.
 *   This dramatically improves retrieval recall at chunk boundaries.
 *
 * @param {string} text - Full document text
 * @param {object} opts
 * @param {number} opts.chunkSize - Characters per chunk (default: from config)
 * @param {number} opts.overlap - Overlap characters (default: from config)
 * @param {string} opts.documentId - Document identifier for metadata
 * @returns {{ chunks: Array<{ id: string, text: string, index: number, documentId: string, charStart: number, charEnd: number }> }}
 */
function chunkText(text, opts = {}) {
  const chunkSize = opts.chunkSize || config.rag.chunkSize;
  const overlap = opts.overlap || config.rag.chunkOverlap;
  const documentId = opts.documentId || 'unknown';

  // Clean the text: normalize whitespace, remove excessive newlines
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < cleanedText.length) {
    let end = Math.min(start + chunkSize, cleanedText.length);

    // Try to break at sentence boundary (., !, ?) within last 20% of chunk
    if (end < cleanedText.length) {
      const lookbackStart = Math.max(start, end - Math.floor(chunkSize * 0.2));
      const segment = cleanedText.slice(lookbackStart, end);
      const sentenceBreak = segment.lastIndexOf('. ');
      const exclamationBreak = segment.lastIndexOf('! ');
      const questionBreak = segment.lastIndexOf('? ');
      const newlineBreak = segment.lastIndexOf('\n');

      const bestBreak = Math.max(sentenceBreak, exclamationBreak, questionBreak, newlineBreak);
      if (bestBreak > 0) {
        end = lookbackStart + bestBreak + 1; // +1 to include the punctuation
      }
    }

    const chunkText = cleanedText.slice(start, end).trim();

    if (chunkText.length > 50) {
      // Skip tiny fragments
      chunks.push({
        id: uuidv4(),
        text: chunkText,
        index,
        documentId,
        charStart: start,
        charEnd: end,
      });
      index++;
    }

    // Move forward by (end - overlap), ensuring we don't go backwards
    start = Math.max(start + 1, end - overlap);
  }

  logger.info(
    `Chunked document ${documentId}: ${chunks.length} chunks (size=${chunkSize}, overlap=${overlap})`
  );

  return { chunks };
}

module.exports = { chunkText };
