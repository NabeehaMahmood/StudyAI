// backend/src/services/chatService.js
// Orchestrates the full RAG pipeline: retrieve → prompt → infer → persist

const { retrieveRelevantChunks } = require('./retrievalService');
const { buildMessages } = require('./promptService');
const { chatCompletion } = require('./llmService');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const logger = require('../utils/logger');

/**
 * Process a user question through the full RAG pipeline.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.documentId - MongoDB document ID
 * @param {string} params.sessionId - Chat session ID (optional, creates new if missing)
 * @param {string} params.collectionName - ChromaDB collection name
 * @param {string} params.query - User question
 * @returns {Promise<object>} - Full response with answer, sources, and metrics
 */
async function processQuery({ userId, documentId, sessionId, collectionName, query }) {
  const totalStart = Date.now();

  // ── Step 1: Get or create chat session ──
  let session;
  if (sessionId) {
    session = await ChatSession.findById(sessionId);
    if (!session) {
      throw Object.assign(new Error('Chat session not found'), { isOperational: true, statusCode: 404 });
    }
  } else {
    session = await ChatSession.create({
      userId,
      documentId,
      title: query.substring(0, 80),
    });
  }

  // ── Step 2: Fetch recent chat history for multi-turn context ──
  const recentMessages = await ChatMessage.find({ sessionId: session._id })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();
  recentMessages.reverse(); // Chronological order

  // ── Step 3: Retrieve relevant chunks (vector + keyword hybrid) ──
  const { chunks, retrievalLatencyMs } = await retrieveRelevantChunks(collectionName, query);

  if (chunks.length === 0) {
    logger.warn(`No relevant chunks found for query: "${query.substring(0, 100)}"`);
  }

  // ── Step 4: Build RAG prompt ──
  const messages = buildMessages(chunks, query, recentMessages);

  // ── Step 5: Call LLM ──
  const { content: answer, usage, inferenceLatencyMs } = await chatCompletion(messages);

  const totalLatencyMs = Date.now() - totalStart;

  // ── Step 6: Persist user message ──
  await ChatMessage.create({
    sessionId: session._id,
    role: 'user',
    content: query,
  });

  // ── Step 7: Persist assistant response with source references ──
  const sourceChunks = chunks.map((c) => ({
    chunkId: c.id,
    text: c.text.substring(0, 300), // Truncate for storage
    page: c.metadata?.chunkIndex || 0,
    similarityScore: c.score,
  }));

  const assistantMessage = await ChatMessage.create({
    sessionId: session._id,
    role: 'assistant',
    content: answer,
    sourceChunks,
    retrievalLatencyMs,
    inferenceLatencyMs,
    totalLatencyMs,
  });

  // ── Step 8: Update session metadata ──
  session.messageCount += 2;
  await session.save();

  logger.info(
    `Query processed: retrieval=${retrievalLatencyMs}ms inference=${inferenceLatencyMs}ms total=${totalLatencyMs}ms`
  );

  return {
    sessionId: session._id,
    answer,
    sourceChunks,
    metrics: {
      retrievalLatencyMs,
      inferenceLatencyMs,
      totalLatencyMs,
      tokensUsed: usage,
      chunksRetrieved: chunks.length,
      averageSimilarity:
        chunks.length > 0
          ? (chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length).toFixed(3)
          : 0,
    },
  };
}

module.exports = { processQuery };
