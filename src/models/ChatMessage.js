// backend/src/models/ChatMessage.js
// Individual question-answer pair with source references

const mongoose = require('mongoose');

const sourceChunkSchema = new mongoose.Schema(
  {
    chunkId: String,
    text: String,
    page: Number,
    similarityScore: Number,
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // Only populated for assistant messages
    sourceChunks: {
      type: [sourceChunkSchema],
      default: [],
    },
    // Performance metrics
    retrievalLatencyMs: {
      type: Number,
      default: null,
    },
    inferenceLatencyMs: {
      type: Number,
      default: null,
    },
    totalLatencyMs: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
