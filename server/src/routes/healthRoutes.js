const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const router = express.Router();

router.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  let mlStatus = 'unreachable';
  const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  try {
    const mlRes = await axios.get(`${mlUrl}/health`, { timeout: 1500 });
    if (mlRes.data && mlRes.data.status === 'ok') {
      mlStatus = 'available';
    }
  } catch (err) {
    mlStatus = 'unavailable';
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      database: dbStatus,
      mlService: mlStatus,
    },
    version: '1.0.0',
    disclaimer: 'Academic prototype. Synthetic clinical data only.',
  });
});

module.exports = router;
