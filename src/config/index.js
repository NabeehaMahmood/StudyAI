// backend/src/config/index.js
// Centralized configuration loaded from environment variables

require('dotenv').config();

const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongoUri: process.env.MONGODB_URL || 'mongodb://localhost:27017/study-assistant',

  // LM Studio — chat and embeddings
  lmStudio: {
    baseUrl: process.env.LM_STUDIO_URL || 'http://localhost:1234/v1',
    chatModel: process.env.LM_STUDIO_MODEL || 'neural-chat',
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
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800,
    dir: process.env.UPLOAD_DIR || './uploads',
  },

  // CORS & Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  socketOrigins: (process.env.SOCKET_ORIGINS || 'http://localhost:3000').split(','),

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    fromName: process.env.EMAIL_FROM_NAME || 'AI Study Assistant',
    fromEmail: process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER,
    adminEmail: process.env.ADMIN_EMAIL || 'asadkhurshid20012001@gmail.com',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiration: process.env.JWT_EXPIRATION || '7d',
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-this',
    inactivityTimeout: parseInt(process.env.INACTIVITY_TIMEOUT, 10) || 15,
  },

  // API Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.API_RATE_WINDOW, 10) * 60 * 1000 || 15 * 60 * 1000,
    max: parseInt(process.env.API_RATE_LIMIT, 10) || 100,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};

module.exports = config;
