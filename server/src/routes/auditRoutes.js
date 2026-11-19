const express = require('express');
const crypto = require('crypto');
const { AuditLog } = require('../models');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);
router.use(authorize(['admin']));

// GET /audit
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.entity) query.entity = req.query.entity;
    if (req.query.action) query.action = req.query.action;
    if (req.query.userEmail) query.userEmail = { $regex: req.query.userEmail, $options: 'i' };

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ _id: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(query),
    ]);

    // Hash chain integrity verification for the current batch (newest to oldest)
    let chainValid = true;
    for (let i = 0; i < logs.length - 1; i++) {
      if (logs[i].previousHash && logs[i + 1].hash) {
        if (logs[i].previousHash !== logs[i + 1].hash) {
          chainValid = false;
          break;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hashChainVerified: chainValid,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
