// backend/src/config/index.js
// Centralized configuration loaded from environment variables

require('dotenv').config();

const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-study-assistant',

  // LM Studio — OpenAI-compatible endpoints
  lmStudio: {
    baseUrl: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1',
    chatModel: process.env.LM_STUDIO_CHAT_MODEL || 'qwen2.5-14b-instruct',
    embeddingModel: process.env.LM_STUDIO_EMBEDDING_MODEL || 'text-embedding-nomic-embed-text-v1.5',
  },

  // ChromaDB
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',

  // RAG tuning
  rag: {
    chunkSize: parseInt(process.env.CHUNK_SIZE, 10) || 800,
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP, 10) || 200,
    topK: parseInt(process.env.TOP_K, 10) || 4,
  },

  // LLM inference
  llm: {
    temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.1,
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS, 10) || 2048,
    topP: parseFloat(process.env.LLM_TOP_P) || 0.9,
  },

  // Upload
  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50,
    dir: process.env.UPLOAD_DIR || './uploads',
  },

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

module.exports = config;
