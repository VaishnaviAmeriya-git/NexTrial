const express = require('express');
const { z } = require('zod');
const { Trial, Participant, AdverseEvent, Visit, DataQuery, EthicsApproval } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess, authorize } = require('../middleware/rbac');
const { recordAudit } = require('../middleware/audit');
const { calculateTrialHealthScore } = require('../services/healthScoreService');

const router = express.Router();

router.use(authenticate);

const trialSchema = z.object({
  title: z.string().min(3),
  shortCode: z.string().min(2).max(12),
  phase: z.enum(['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Pilot / Exploratory']),
  condition: z.string().min(2),
  formulation: z.string().min(2),
  design: z.enum([
    'Randomized, Double-Blind, Placebo-Controlled',
    'Open-Label, Active-Controlled',
    'Single-Arm Exploratory',
    'Cross-Over Comparative',
  ]),
  targetEnrollment: z.number().int().positive(),
  protocolVersion: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  expectedEnrollmentDate: z.string().optional(),
  visitSchedule: z.array(
    z.object({
      visitNo: z.number().int(),
      name: z.string(),
      dayOffset: z.number(),
      windowDays: z.number(),
    })
  ).optional(),
});

// GET /trials (filtered by user trial access)
router.get('/', async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query._id = { $in: req.user.assignedTrials || [] };
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    const trials = await Trial.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: trials });
  } catch (err) {
    next(err);
  }
});

// POST /trials
router.post('/', authorize(['admin', 'coordinator']), async (req, res, next) => {
  try {
    const parse = trialSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid trial input', details: parse.error.issues },
      });
    }

    const data = parse.data;
    // Default 8-visit schedule if none provided
    if (!data.visitSchedule || data.visitSchedule.length === 0) {
      data.visitSchedule = [
        { visitNo: 1, name: 'Screening & Baseline', dayOffset: 0, windowDays: 2 },
        { visitNo: 2, name: 'Randomization & Initiation', dayOffset: 14, windowDays: 3 },
        { visitNo: 3, name: 'Follow-up & Risk Check', dayOffset: 28, windowDays: 3 },
        { visitNo: 4, name: 'Mid-term Assessment', dayOffset: 42, windowDays: 4 },
        { visitNo: 5, name: 'Routine Follow-up', dayOffset: 56, windowDays: 4 },
        { visitNo: 6, name: 'Clinical Evaluation', dayOffset: 70, windowDays: 4 },
        { visitNo: 7, name: 'Pre-completion Review', dayOffset: 84, windowDays: 4 },
        { visitNo: 8, name: 'Final Study Exit', dayOffset: 90, windowDays: 5 },
      ];
    }

    const trial = await Trial.create(data);

    // If coordinator created, assign trial to them automatically
    if (req.user.role === 'coordinator') {
      req.user.assignedTrials.push(trial._id);
      await req.user.save();
    }

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'Trial',
      entityId: trial._id,
      action: 'CREATE',
      before: null,
      after: trial,
      req,
    });

    res.status(201).json({ success: true, data: trial });
  } catch (err) {
    next(err);
  }
});

// GET /trials/:id
router.get('/:id', requireTrialAccess, async (req, res, next) => {
  try {
    const trial = await Trial.findById(req.params.id);
    if (!trial) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Trial not found' },
      });
    }
    res.status(200).json({ success: true, data: trial });
  } catch (err) {
    next(err);
  }
});

// PATCH /trials/:id
router.patch('/:id', requireTrialAccess, authorize(['admin', 'coordinator', 'investigator']), async (req, res, next) => {
  try {
    const trial = await Trial.findById(req.params.id);
    if (!trial) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trial not found' } });
    }

    const before = trial.toObject();
    const allowed = ['title', 'status', 'phase', 'condition', 'formulation', 'design', 'targetEnrollment', 'protocolVersion', 'startDate', 'endDate', 'expectedEnrollmentDate', 'ctri'];
    
    allowed.forEach(f => {
      if (req.body[f] !== undefined) {
        trial[f] = req.body[f];
      }
    });

    await trial.save();

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'Trial',
      entityId: trial._id,
      action: req.body.status && req.body.status !== before.status ? 'STATUS_CHANGE' : 'UPDATE',
      before,
      after: trial.toObject(),
      req,
    });

    res.status(200).json({ success: true, data: trial });
  } catch (err) {
    next(err);
  }
});

// GET /trials/:id/health-score
router.get('/:id/health-score', requireTrialAccess, async (req, res, next) => {
  try {
    const trial = await Trial.findById(req.params.id);
    if (!trial) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trial not found' } });
    }

    const health = await calculateTrialHealthScore(trial);
    res.status(200).json({ success: true, data: health });
  } catch (err) {
    next(err);
  }
});

// GET /trials/:id/summary
router.get('/:id/summary', requireTrialAccess, async (req, res, next) => {
  try {
    const trial = await Trial.findById(req.params.id);
    if (!trial) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trial not found' } });
    }

    const trialId = trial._id;
    const [enrolled, completed, active, withdrawn, saeCount, openQueries, ethics] = await Promise.all([
      Participant.countDocuments({ trialId }),
      Participant.countDocuments({ trialId, status: 'Completed' }),
      Participant.countDocuments({ trialId, status: 'Active' }),
      Participant.countDocuments({ trialId, status: { $in: ['Withdrawn', 'Lost to follow-up'] } }),
      AdverseEvent.countDocuments({ trialId, serious: true }),
      DataQuery.countDocuments({ trialId, status: 'Open' }),
      EthicsApproval.findOne({ trialId, status: 'Active' }).sort({ validUntil: -1 }),
    ]);

    const health = await calculateTrialHealthScore(trial);

    res.status(200).json({
      success: true,
      data: {
        trial,
        enrolled,
        completed,
        active,
        withdrawn,
        targetEnrollment: trial.targetEnrollment,
        enrollmentPct: Math.min(100, Math.round((enrolled / trial.targetEnrollment) * 100)),
        saeCount,
        openQueries,
        activeEthicsApproval: ethics,
        healthScore: health,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /trials/:id/kpis
router.get('/:id/kpis', requireTrialAccess, async (req, res, next) => {
  try {
    const trial = await Trial.findById(req.params.id);
    if (!trial) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trial not found' } });
    }

    const trialId = trial._id;
    const [totalParticipants, totalVisits, missedVisits, totalAEs, seriousAEs] = await Promise.all([
      Participant.countDocuments({ trialId }),
      Visit.countDocuments({ trialId }),
      Visit.countDocuments({ trialId, status: 'Missed' }),
      AdverseEvent.countDocuments({ trialId }),
      AdverseEvent.countDocuments({ trialId, serious: true }),
    ]);

    const visitCompliancePct = totalVisits > 0 ? Math.round(((totalVisits - missedVisits) / totalVisits) * 100) : 100;

    res.status(200).json({
      success: true,
      data: {
        totalParticipants,
        totalVisits,
        missedVisits,
        visitCompliancePct,
        totalAEs,
        seriousAEs,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
