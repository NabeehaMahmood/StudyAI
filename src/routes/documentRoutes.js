const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} = require('../controllers/documentController');

// POST /api/documents/upload — Upload and process a PDF (temporarily public for testing)
router.post('/upload', upload.single('pdf'), uploadDocument);

// All other document routes require authentication
router.use(protect);

// GET /api/documents — List user's documents
router.get('/', listDocuments);

// GET /api/documents/:id — Get document details
router.get('/:id', getDocument);

// DELETE /api/documents/:id — Delete a document
router.delete('/:id', deleteDocument);

module.exports = router;