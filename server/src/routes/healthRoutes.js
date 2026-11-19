const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const router = express.Router();

router.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  let mlStatus = 'unreachable';
  const mlUrls = [process.env.ML_SERVICE_URL, 'http://127.0.0.1:8000', 'http://localhost:8000'].filter(Boolean);
  for (const url of mlUrls) {
    try {
      const mlRes = await axios.get(`${url}/health`, { timeout: 1000 });
      if (mlRes.data && mlRes.data.status === 'ok') {
        mlStatus = 'available';
        break;
      }
    } catch (err) {}
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
