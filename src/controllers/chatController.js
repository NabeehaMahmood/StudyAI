// backend/src/controllers/chatController.js
// Handles chat queries and history retrieval

const Document = require('../models/Document');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const { processQuery } = require('../services/chatService');
const logger = require('../utils/logger');

/**
 * POST /api/chat/query
 * Process a user question against an uploaded document.
 *
 * Body: { userId, documentId, sessionId?, query }
 */
async function queryDocument(req, res, next) {
  try {
    const { userId, documentId, sessionId, query } = req.body;

    // Validate required fields
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    if (!documentId) {
      return res.status(400).json({ success: false, error: 'documentId is required' });
    }

    const effectiveUserId = userId || req.headers['x-user-id'] || 'default-user';

    // Verify document exists and is ready
    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    if (doc.status !== 'ready') {
      return res.status(422).json({
        success: false,
        error: `Document is not ready for queries (status: ${doc.status})`,
      });
    }

    // Run the full RAG pipeline
    const result = await processQuery({
      userId: effectiveUserId,
      documentId: doc._id.toString(),
      sessionId,
      collectionName: doc.chromaCollectionName,
      query: query.trim(),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(`Chat query failed: ${error.message}`);
    next(error);
  }
}

/**
 * GET /api/chat/sessions?userId=xxx&documentId=xxx
 * List chat sessions for a user/document.
 */
async function listSessions(req, res, next) {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'default-user';
    const { documentId } = req.query;

    const filter = { userId };
    if (documentId) filter.documentId = documentId;

    const sessions = await ChatSession.find(filter)
      .select('title messageCount documentId createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/chat/sessions/:sessionId/messages
 * Get all messages in a chat session.
 */
async function getSessionMessages(req, res, next) {
  try {
    const messages = await ChatMessage.find({ sessionId: req.params.sessionId })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/chat/sessions/:sessionId
 * Delete a chat session and its messages.
 */
async function deleteSession(req, res, next) {
  try {
    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    await ChatMessage.deleteMany({ sessionId: session._id });
    await ChatSession.findByIdAndDelete(session._id);

    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = { queryDocument, listSessions, getSessionMessages, deleteSession };
