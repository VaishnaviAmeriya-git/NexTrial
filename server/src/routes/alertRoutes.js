const express = require('express');
const { Alert } = require('../models');
const { authenticate } = require('../middleware/auth');
const AlertsService = require('../services/alertsService');

const router = express.Router();

router.use(authenticate);

// GET /alerts
router.get('/', async (req, res, next) => {
  try {
    // Run automated check to discover any new alerts
    await AlertsService.runAlertChecks();

    const query = {};
    if (req.user.role !== 'admin') {
      query.trialId = { $in: req.user.assignedTrials || [] };
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.trialId) {
      query.trialId = req.query.trialId;
    }

    const alerts = await Alert.find(query)
      .populate('trialId', 'title shortCode')
      .populate('participantId', 'subjectId')
      .sort({ createdAt: -1 })
      .limit(50);

    const openCount = await Alert.countDocuments({ ...query, status: 'open' });

    res.status(200).json({ success: true, data: alerts, meta: { openCount } });
  } catch (err) {
    next(err);
  }
});

// PATCH /alerts/:id/ack
router.patch('/:id/ack', async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Alert not found' } });
    }

    alert.status = 'ack';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = req.user._id;
    await alert.save();

    res.status(200).json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
