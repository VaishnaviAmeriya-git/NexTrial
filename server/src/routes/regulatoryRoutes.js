const express = require('express');
const { z } = require('zod');
const { Trial, EthicsApproval } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess, authorize } = require('../middleware/rbac');
const { recordAudit } = require('../middleware/audit');

const router = express.Router();

router.use(authenticate);

const ethicsSchema = z.object({
  committeeName: z.string().min(3),
  approvalNo: z.string().min(2),
  type: z.enum(['initial', 'amendment', 'continuing_review']),
  approvedAt: z.string(),
  validUntil: z.string(),
  status: z.enum(['Active', 'Pending Renewal', 'Expired', 'Revoked']).optional(),
  notes: z.string().optional(),
});

// GET /trials/:id/ethics
router.get('/trials/:id/ethics', requireTrialAccess, async (req, res, next) => {
  try {
    const approvals = await EthicsApproval.find({ trialId: req.params.id }).sort({ approvedAt: -1 });
    res.status(200).json({ success: true, data: approvals });
  } catch (err) {
    next(err);
  }
});

// POST /trials/:id/ethics
router.post('/trials/:id/ethics', requireTrialAccess, authorize(['admin', 'iec_member', 'coordinator']), async (req, res, next) => {
  try {
    const trialId = req.params.id;
    const trial = await Trial.findById(trialId);
    if (!trial) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trial not found' } });
    }

    const parse = ethicsSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid ethics approval input', details: parse.error.issues },
      });
    }

    const approval = await EthicsApproval.create({
      ...parse.data,
      trialId,
    });

    // Update trial status if initial approval recorded
    if (parse.data.type === 'initial' && trial.status === 'IEC Pending') {
      trial.status = 'Approved';
      await trial.save();
    }

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'EthicsApproval',
      entityId: approval._id,
      action: 'CREATE',
      before: null,
      after: approval.toObject(),
      req,
    });

    res.status(201).json({ success: true, data: approval });
  } catch (err) {
    next(err);
  }
});

// PUT /trials/:id/ctri
router.put('/trials/:id/ctri', requireTrialAccess, authorize(['admin', 'coordinator']), async (req, res, next) => {
  try {
    const trial = await Trial.findById(req.params.id);
    if (!trial) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trial not found' } });
    }

    const { number, registeredAt, prospective } = req.body;
    if (!number || !/^CTRI\/\d{4}\/\d{2}\/\d{6}$/.test(number)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid CTRI format. Expected format: CTRI/YYYY/MM/NNNNNN (e.g. CTRI/2026/03/048123)',
        },
      });
    }

    const before = trial.ctri;
    trial.ctri = {
      number,
      registeredAt: registeredAt ? new Date(registeredAt) : new Date(),
      prospective: prospective !== undefined ? prospective : true,
    };

    if (trial.status === 'Approved') {
      trial.status = 'CTRI Registered';
    }

    await trial.save();

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'Trial',
      entityId: trial._id,
      action: 'UPDATE',
      before,
      after: trial.ctri,
      req,
    });

    res.status(200).json({ success: true, data: trial });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
