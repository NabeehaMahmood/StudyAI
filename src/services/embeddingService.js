// backend/src/services/embeddingService.js
// Generates embeddings via LM Studio's OpenAI-compatible /v1/embeddings endpoint
// Uses text-embedding model for RAG vector search

const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');

// OpenAI client for embeddings (text-embedding model)
const openai = new OpenAI({
  baseURL: config.lmStudio.embedding.url,
  apiKey: 'lm-studio',
});

/**
 * Generate embedding for a single text string.
 * @param {string} text
 * @returns {Promise<number[]>} - Embedding vector
 */
async function generateEmbedding(text) {
  const startTime = Date.now();

  const response = await openai.embeddings.create({
    model: config.lmStudio.embedding.model,
    input: text,
  });

  const elapsed = Date.now() - startTime;
  logger.debug(`Embedding generated in ${elapsed}ms (${text.length} chars)`);

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a batch.
 * Processes sequentially to avoid overwhelming LM Studio.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
async function generateEmbeddingsBatch(texts) {
  const startTime = Date.now();
  const embeddings = [];

  // Process in small batches to balance throughput and memory
  const BATCH_SIZE = 8;
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await openai.embeddings.create({
      model: config.lmStudio.embedding.model,
      input: batch,
    });

    for (const item of response.data) {
      embeddings.push(item.embedding);
    }

    logger.debug(`Embedded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)}`);
  }

  const elapsed = Date.now() - startTime;
  logger.info(`Batch embedding complete: ${texts.length} texts in ${elapsed}ms`);

  return embeddings;
}

module.exports = { generateEmbedding, generateEmbeddingsBatch };
