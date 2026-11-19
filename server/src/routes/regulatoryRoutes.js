const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess, authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/trials/:id/ethics', requireTrialAccess, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Ethics approvals list stub' } });
});

router.post('/trials/:id/ethics', requireTrialAccess, authorize(['admin', 'iec_member', 'coordinator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Ethics approval record stub' } });
});

router.put('/trials/:id/ctri', requireTrialAccess, authorize(['admin', 'coordinator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'CTRI update stub' } });
});

module.exports = router;
