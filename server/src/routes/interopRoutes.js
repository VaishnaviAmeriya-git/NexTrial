const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess, authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/trials/:id/export/fhir', requireTrialAccess, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'FHIR R4 export stub' } });
});

router.get('/trials/:id/export/cdisc', requireTrialAccess, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'CDISC export stub' } });
});

module.exports = router;
