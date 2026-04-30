// backend/src/services/vectorStoreService.js
// ChromaDB operations: create collection, upsert, query

const { getChromaClient } = require('../config/chromaClient');
const logger = require('../utils/logger');

/**
 * Get or create a ChromaDB collection for a specific document.
 * Collection name format: user_{userId}_doc_{documentId}
 */
async function getOrCreateCollection(collectionName) {
  const client = await getChromaClient();
  const collection = await client.getOrCreateCollection({
    name: collectionName,
    metadata: { 'hnsw:space': 'cosine' }, // Use cosine similarity
  });
  logger.debug(`ChromaDB collection ready: ${collectionName}`);
  return collection;
}

/**
 * Store chunk embeddings in ChromaDB.
 * @param {string} collectionName
 * @param {Array<{ id: string, text: string, index: number, documentId: string, charStart: number, charEnd: number }>} chunks
 * @param {number[][]} embeddings
 */
async function storeChunks(collectionName, chunks, embeddings) {
  const collection = await getOrCreateCollection(collectionName);

  const ids = chunks.map((c) => c.id);
  const documents = chunks.map((c) => c.text);
  const metadatas = chunks.map((c) => ({
    chunkIndex: c.index,
    documentId: c.documentId,
    charStart: c.charStart,
    charEnd: c.charEnd,
  }));

  await collection.upsert({
    ids,
    embeddings,
    documents,
    metadatas,
  });

  logger.info(`Stored ${chunks.length} chunks in collection ${collectionName}`);
}

/**
 * Query ChromaDB for the most similar chunks to a query embedding.
 * @param {string} collectionName
 * @param {number[]} queryEmbedding
 * @param {number} topK
 * @returns {Promise<Array<{ id: string, text: string, metadata: object, score: number }>>}
 */
async function querySimilarChunks(collectionName, queryEmbedding, topK = 4) {
  const collection = await getOrCreateCollection(collectionName);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    include: ['documents', 'metadatas', 'distances'],
  });

  if (!results || !results.ids || results.ids.length === 0) {
    return [];
  }

  const chunks = results.ids[0].map((id, idx) => ({
    id,
    text: results.documents[0][idx],
    metadata: results.metadatas[0][idx],
    // ChromaDB returns distances; for cosine, distance = 1 - similarity
    score: 1 - (results.distances[0][idx] || 0),
  }));

  logger.info(
    `Retrieved ${chunks.length} chunks from ${collectionName} (scores: ${chunks.map((c) => c.score.toFixed(3)).join(', ')})`
  );

  return chunks;
}

/**
 * Delete a collection (used when removing a document).
 */
async function deleteCollection(collectionName) {
  const client = await getChromaClient();
  try {
    await client.deleteCollection({ name: collectionName });
    logger.info(`Deleted ChromaDB collection: ${collectionName}`);
  } catch (err) {
    logger.warn(`Could not delete collection ${collectionName}: ${err.message}`);
  }
}

module.exports = {
  getOrCreateCollection,
  storeChunks,
  querySimilarChunks,
  deleteCollection,
};
