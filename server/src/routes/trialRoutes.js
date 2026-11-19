const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Trial list stub' } });
});

router.post('/', (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Trial create stub' } });
});

router.get('/:id', requireTrialAccess, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Trial detail stub' } });
});

router.patch('/:id', requireTrialAccess, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Trial update stub' } });
});

router.get('/:id/summary', requireTrialAccess, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Trial summary stub' } });
});

router.get('/:id/health-score', requireTrialAccess, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Health score stub' } });
});

router.get('/:id/kpis', requireTrialAccess, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'KPIs stub' } });
});

module.exports = router;
