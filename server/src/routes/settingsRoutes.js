const express = require('express');
const { Settings } = require('../models');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { recordAudit } = require('../middleware/audit');

const router = express.Router();

router.use(authenticate);

// GET /settings
router.get('/', async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ key: 'global_ctms_settings' });
    if (!settings) {
      settings = await Settings.create({ key: 'global_ctms_settings' });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

// PATCH /settings (Admin only)
router.patch('/', authorize(['admin']), async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ key: 'global_ctms_settings' });
    if (!settings) {
      settings = await Settings.create({ key: 'global_ctms_settings' });
    }

    const before = settings.toObject();
    if (req.body.regulatoryTimelines) {
      settings.regulatoryTimelines = {
        ...settings.regulatoryTimelines.toObject(),
        ...req.body.regulatoryTimelines,
      };
    }
    if (req.body.trialHealthScoreWeights) {
      settings.trialHealthScoreWeights = {
        ...settings.trialHealthScoreWeights.toObject(),
        ...req.body.trialHealthScoreWeights,
      };
    }
    if (req.body.riskBands) {
      settings.riskBands = {
        ...settings.riskBands.toObject(),
        ...req.body.riskBands,
      };
    }

    settings.updatedBy = req.user._id;
    await settings.save();

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'Settings',
      entityId: settings._id,
      action: 'UPDATE',
      before,
      after: settings.toObject(),
      req,
    });

    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
