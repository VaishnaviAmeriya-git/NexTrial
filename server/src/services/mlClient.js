const axios = require('axios');

async function getMlUrl() {
  const candidates = [process.env.ML_SERVICE_URL, 'http://127.0.0.1:8000', 'http://localhost:8000'].filter(Boolean);
  for (const url of candidates) {
    try {
      const r = await axios.get(`${url}/health`, { timeout: 800 });
      if (r.status === 200) return url;
    } catch (e) {}
  }
  return candidates[0] || 'http://127.0.0.1:8000';
}

class MLClient {
  /**
   * Predict dropout risk for a participant using anonymized features only
   */
  static async predictRisk(features) {
    try {
      const mlUrl = await getMlUrl();
      const response = await axios.post(`${mlUrl}/predict`, features, {
        timeout: 2500, // Non-blocking fast timeout
      });
      return {
        available: true,
        data: response.data,
      };
    } catch (err) {
      console.warn(`[MLClient] Prediction service unreachable: ${err.message}. Providing graceful fallback.`);
      return {
        available: false,
        message: 'Prediction unavailable',
        data: {
          probability: null,
          band: 'Unknown',
          topFactors: [],
          suggestedActions: ['Prediction unavailable. Proceed with standard protocol monitoring.'],
          modelVersion: 'unavailable',
        },
      };
    }
  }

  /**
   * Batch predict dropout risk
   */
  static async batchPredict(participants) {
    try {
      const mlUrl = await getMlUrl();
      const response = await axios.post(`${mlUrl}/predict/batch`, { participants }, {
        timeout: 5000,
      });
      return {
        available: true,
        data: response.data,
      };
    } catch (err) {
      console.warn(`[MLClient] Batch prediction failed: ${err.message}`);
      return {
        available: false,
        message: 'Prediction unavailable',
        data: participants.map(p => ({
          participantId: p.participantId,
          probability: null,
          band: 'Unknown',
          topFactors: [],
          suggestedActions: [],
        })),
      };
    }
  }

  /**
   * Retrieve ML model info and metrics
   */
  static async getModelInfo() {
    try {
      const mlUrl = await getMlUrl();
      const response = await axios.get(`${mlUrl}/model-info`, { timeout: 2000 });
      return { available: true, data: response.data };
    } catch (err) {
      return {
        available: false,
        data: {
          modelVersion: 'v1.0-rf (offline)',
          algorithm: 'Calibrated Random Forest (isotonic)',
          metrics: { rocAuc: 'unavailable' },
          disclaimer: 'Academic prototype. ML service currently offline.',
        },
      };
    }
  }
}

module.exports = MLClient;
