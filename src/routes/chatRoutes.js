// backend/src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  queryDocument,
  listSessions,
  getSessionMessages,
  deleteSession,
} = require('../controllers/chatController');

// All chat routes require authentication
router.use(protect);

// POST /api/chat/query — Ask a question about a document
router.post('/query', queryDocument);

// GET /api/chat/sessions — List chat sessions
router.get('/sessions', listSessions);

// GET /api/chat/sessions/:sessionId/messages — Get session messages
router.get('/sessions/:sessionId/messages', getSessionMessages);

// DELETE /api/chat/sessions/:sessionId — Delete a session
router.delete('/sessions/:sessionId', deleteSession);

module.exports = router;
