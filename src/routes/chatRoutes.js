// backend/src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const {
  queryDocument,
  listSessions,
  getSessionMessages,
  deleteSession,
} = require('../controllers/chatController');

// POST /api/chat/query — Ask a question about a document
router.post('/query', queryDocument);

// GET /api/chat/sessions — List chat sessions
router.get('/sessions', listSessions);

// GET /api/chat/sessions/:sessionId/messages — Get session messages
router.get('/sessions/:sessionId/messages', getSessionMessages);

// DELETE /api/chat/sessions/:sessionId — Delete a session
router.delete('/sessions/:sessionId', deleteSession);

module.exports = router;
