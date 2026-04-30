// backend/src/controllers/documentController.js
// Handles PDF upload, processing pipeline, and document management

const path = require('path');
const Document = require('../models/Document');
const { extractTextFromPDF } = require('../services/pdfService');
const { chunkText } = require('../services/chunkingService');
const { generateEmbeddingsBatch } = require('../services/embeddingService');
const { storeChunks, deleteCollection } = require('../services/vectorStoreService');
const logger = require('../utils/logger');

/**
 * POST /api/documents/upload
 * Upload a PDF, extract text, chunk, embed, and store in ChromaDB.
 */
async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    const userId = req.body.userId || req.headers['x-user-id'] || 'default-user';

    // Create document record in MongoDB (status: processing)
    const doc = await Document.create({
      userId,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      chromaCollectionName: `user_${userId}_doc_temp`, // Updated after creation
    });

    // Update collection name with actual document ID
    const collectionName = `user_${userId.replace(/[^a-zA-Z0-9_]/g, '_')}_doc_${doc._id}`;
    doc.chromaCollectionName = collectionName;

    logger.info(`Processing document: ${doc.originalName} (${(doc.fileSize / 1024).toFixed(1)} KB)`);

    // ── Pipeline: Extract → Chunk → Embed → Store ──

    // Step 1: Extract text from PDF
    const { text, pageCount } = await extractTextFromPDF(doc.filePath);
    doc.pageCount = pageCount;

    if (!text || text.trim().length < 100) {
      doc.status = 'error';
      doc.errorMessage = 'PDF contains insufficient text content. It may be scanned/image-based.';
      await doc.save();
      return res.status(422).json({
        success: false,
        error: doc.errorMessage,
        documentId: doc._id,
      });
    }

    // Step 2: Chunk text with overlap
    const { chunks } = chunkText(text, { documentId: doc._id.toString() });
    doc.totalChunks = chunks.length;

    // Step 3: Generate embeddings for all chunks
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await generateEmbeddingsBatch(chunkTexts);

    // Step 4: Store in ChromaDB
    await storeChunks(collectionName, chunks, embeddings);

    // Mark as ready
    doc.status = 'ready';
    await doc.save();

    logger.info(
      `Document processed: ${doc.originalName} → ${chunks.length} chunks → ${collectionName}`
    );

    res.status(201).json({
      success: true,
      document: {
        id: doc._id,
        originalName: doc.originalName,
        pageCount: doc.pageCount,
        totalChunks: doc.totalChunks,
        status: doc.status,
        collectionName,
      },
    });
  } catch (error) {
    logger.error(`Document upload failed: ${error.message}`);
    next(error);
  }
}

/**
 * GET /api/documents?userId=xxx
 * List all documents for a user.
 */
async function listDocuments(req, res, next) {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'default-user';

    const documents = await Document.find({ userId })
      .select('originalName pageCount totalChunks status createdAt fileSize')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, documents });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/documents/:id
 * Get a specific document's details.
 */
async function getDocument(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id).lean();
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/documents/:id
 * Remove a document and its ChromaDB collection.
 */
async function deleteDocument(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Delete ChromaDB collection
    await deleteCollection(doc.chromaCollectionName);

    // Delete file from disk
    const fs = require('fs');
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    // Delete MongoDB record
    await Document.findByIdAndDelete(doc._id);

    logger.info(`Document deleted: ${doc.originalName}`);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadDocument, listDocuments, getDocument, deleteDocument };
