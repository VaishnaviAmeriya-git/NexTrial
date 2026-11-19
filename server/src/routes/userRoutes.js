const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);
router.use(authorize(['admin']));

router.get('/', (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'User list stub' } });
});

router.post('/', (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'User creation stub' } });
});

router.patch('/:id', (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'User update stub' } });
});

module.exports = router;
