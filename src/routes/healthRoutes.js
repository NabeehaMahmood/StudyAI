// backend/src/routes/healthRoutes.js
// Health check endpoint for monitoring

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const config = require('../config');

router.get('/', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  let chromaStatus = 'unknown';
  try {
    const { getChromaClient } = require('../config/chromaClient');
    const client = await getChromaClient();
    await client.heartbeat();
    chromaStatus = 'connected';
  } catch {
    chromaStatus = 'disconnected';
  }

  let lmStudioStatus = 'unknown';
  try {
    const response = await fetch(`${config.lmStudio.baseUrl}/models`);
    lmStudioStatus = response.ok ? 'connected' : 'error';
  } catch {
    lmStudioStatus = 'disconnected';
  }

  const allHealthy = mongoStatus === 'connected' && chromaStatus === 'connected' && lmStudioStatus === 'connected';

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: {
      mongodb: mongoStatus,
      chromadb: chromaStatus,
      lmStudio: lmStudioStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
