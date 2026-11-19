const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess, authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// Protocol Deviations
router.get('/trials/:id/deviations', requireTrialAccess, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Deviations list stub' } });
});

router.post('/trials/:id/deviations', requireTrialAccess, authorize(['admin', 'coordinator', 'investigator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Deviation log stub' } });
});

// Data Queries
router.get('/trials/:id/queries', requireTrialAccess, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Queries list stub' } });
});

router.post('/trials/:id/queries', requireTrialAccess, authorize(['admin', 'coordinator', 'investigator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Query raise stub' } });
});

router.patch('/queries/:id', authorize(['admin', 'coordinator', 'investigator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Query update stub' } });
});

module.exports = router;
