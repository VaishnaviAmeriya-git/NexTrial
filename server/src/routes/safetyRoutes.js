const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess, authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/trials/:id/adverse-events', requireTrialAccess, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Adverse events list stub' } });
});

router.post('/trials/:id/adverse-events', requireTrialAccess, authorize(['admin', 'investigator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'AE entry stub' } });
});

router.patch('/adverse-events/:id', authorize(['admin', 'investigator', 'pv_officer']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'AE update stub' } });
});

router.post('/adverse-events/:id/code', authorize(['admin', 'pv_officer']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'AE coding stub' } });
});

router.get('/trials/:id/safety-signals', requireTrialAccess, authorize(['admin', 'dsmb', 'investigator', 'pv_officer']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'DSMB safety signals stub' } });
});

module.exports = router;
