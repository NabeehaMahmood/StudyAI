// backend/src/config/chromaClient.js
// ChromaDB client singleton

const { ChromaClient } = require('chromadb');
const config = require('./index');
const logger = require('../utils/logger');

let client = null;

const getChromaClient = async () => {
  if (!client) {
    client = new ChromaClient({ path: config.chromaUrl });
    logger.info(`ChromaDB client initialized at ${config.chromaUrl}`);
  }
  return client;
};

module.exports = { getChromaClient };
