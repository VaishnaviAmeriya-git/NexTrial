const express = require('express');
const { authLimiter } = require('../middleware/rateLimit');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Stubs for Phase 0 (implemented fully in Phase 1)
router.post('/login', authLimiter, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Phase 0 stub' } });
});

router.post('/refresh', (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Phase 0 stub' } });
});

router.post('/logout', (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out' });
});

router.get('/me', authenticate, (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

router.post('/change-password', authenticate, (req, res) => {
  res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Phase 0 stub' } });
});

module.exports = router;
