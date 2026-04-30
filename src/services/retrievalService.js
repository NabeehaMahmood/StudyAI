// backend/src/services/retrievalService.js
// Hybrid search: vector similarity + optional keyword scoring

const { generateEmbedding } = require('./embeddingService');
const { querySimilarChunks } = require('./vectorStoreService');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Simple keyword scoring using term frequency.
 * This provides a BM25-like signal without external dependencies.
 *
 * @param {string} query - User query
 * @param {string} chunkText - Chunk text
 * @returns {number} Score between 0 and 1
 */
function keywordScore(query, chunkText) {
  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 2); // Ignore short words

  if (queryTerms.length === 0) return 0;

  const chunkLower = chunkText.toLowerCase();
  let matches = 0;

  for (const term of queryTerms) {
    // Count occurrences (capped at 3 to avoid single-term dominance)
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const count = (chunkLower.match(regex) || []).length;
    matches += Math.min(count, 3);
  }

  // Normalize: max possible = queryTerms.length * 3
  return matches / (queryTerms.length * 3);
}

/**
 * Hybrid retrieval combining vector similarity with keyword matching.
 *
 * Strategy:
 * 1. Embed the query
 * 2. Retrieve top-K * 2 chunks from ChromaDB (over-fetch for re-ranking)
 * 3. Compute keyword score for each chunk
 * 4. Combine: hybrid_score = alpha * vector_score + (1 - alpha) * keyword_score
 * 5. Return top-K by hybrid score
 *
 * @param {string} collectionName - ChromaDB collection
 * @param {string} query - User question
 * @param {object} opts
 * @param {number} opts.topK - Final number of results (default: config.rag.topK)
 * @param {number} opts.alpha - Weight for vector similarity (default: 0.7)
 * @param {boolean} opts.useHybrid - Enable hybrid scoring (default: true)
 * @returns {Promise<{ chunks: Array, queryEmbedding: number[], retrievalLatencyMs: number }>}
 */
async function retrieveRelevantChunks(collectionName, query, opts = {}) {
  const startTime = Date.now();
  const topK = opts.topK || config.rag.topK;
  const alpha = opts.alpha ?? 0.7;
  const useHybrid = opts.useHybrid ?? true;

  // Step 1: Embed the query
  const queryEmbedding = await generateEmbedding(query);

  // Step 2: Fetch extra candidates for re-ranking
  const fetchK = useHybrid ? topK * 2 : topK;
  const vectorResults = await querySimilarChunks(collectionName, queryEmbedding, fetchK);

  let finalChunks;

  if (useHybrid && vectorResults.length > 0) {
    // Step 3-4: Hybrid re-ranking
    const scored = vectorResults.map((chunk) => {
      const kScore = keywordScore(query, chunk.text);
      const hybridScore = alpha * chunk.score + (1 - alpha) * kScore;

      return {
        ...chunk,
        keywordScore: kScore,
        hybridScore,
      };
    });

    // Step 5: Sort by hybrid score, take topK
    scored.sort((a, b) => b.hybridScore - a.hybridScore);
    finalChunks = scored.slice(0, topK);

    logger.debug(
      `Hybrid re-ranked: ${finalChunks.map((c) => `vec=${c.score.toFixed(3)} kw=${c.keywordScore.toFixed(3)} hyb=${c.hybridScore.toFixed(3)}`).join(' | ')}`
    );
  } else {
    finalChunks = vectorResults.slice(0, topK);
  }

  const retrievalLatencyMs = Date.now() - startTime;

  logger.info(`Retrieval complete in ${retrievalLatencyMs}ms: ${finalChunks.length} chunks`);

  return {
    chunks: finalChunks,
    queryEmbedding,
    retrievalLatencyMs,
  };
}

module.exports = { retrieveRelevantChunks, keywordScore };
