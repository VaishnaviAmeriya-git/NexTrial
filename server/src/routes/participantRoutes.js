const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess, authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// Participant operations by trial
router.get('/trials/:id/participants', requireTrialAccess, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Participants list stub' } });
});

router.post('/trials/:id/participants', requireTrialAccess, authorize(['admin', 'coordinator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Participant create stub' } });
});

// Participant individual operations
router.get('/participants/:id', (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Participant detail stub' } });
});

router.patch('/participants/:id', authorize(['admin', 'coordinator', 'investigator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Participant update stub' } });
});

router.post('/participants/:id/consent', authorize(['admin', 'coordinator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Consent record stub' } });
});

router.post('/participants/:id/status', authorize(['admin', 'investigator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Status change stub' } });
});

module.exports = router;
