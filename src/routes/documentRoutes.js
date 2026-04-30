// backend/src/routes/documentRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} = require('../controllers/documentController');

// POST /api/documents/upload — Upload and process a PDF
router.post('/upload', upload.single('pdf'), uploadDocument);

// GET /api/documents — List user's documents
router.get('/', listDocuments);

// GET /api/documents/:id — Get document details
router.get('/:id', getDocument);

// DELETE /api/documents/:id — Delete a document
router.delete('/:id', deleteDocument);

module.exports = router;
