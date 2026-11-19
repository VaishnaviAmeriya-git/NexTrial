const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/participants/:id/visits', (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Visits list stub' } });
});

router.post('/participants/:id/visits/generate', authorize(['admin', 'coordinator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Visits generate stub' } });
});

router.patch('/visits/:id', authorize(['admin', 'coordinator', 'investigator']), (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Visit update stub' } });
});

module.exports = router;
