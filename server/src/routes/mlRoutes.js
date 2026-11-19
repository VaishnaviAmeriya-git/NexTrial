const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess, authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.post('/participants/:id/risk', authorize(['admin', 'investigator', 'coordinator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Participant risk score stub' } });
});

router.post('/trials/:id/risk/refresh', requireTrialAccess, authorize(['admin', 'investigator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Batch risk refresh stub' } });
});

router.get('/ml/model-info', (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Model info stub' } });
});

router.post('/ml/retrain', authorize(['admin']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Retrain stub' } });
});

module.exports = router;
