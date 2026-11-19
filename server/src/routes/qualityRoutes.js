const express = require('express');
const { z } = require('zod');
const { ProtocolDeviation, DataQuery, Trial, Participant } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess, authorize } = require('../middleware/rbac');
const { recordAudit } = require('../middleware/audit');

const router = express.Router();

router.use(authenticate);

// --- Protocol Deviations ---
const deviationSchema = z.object({
  participantId: z.string().optional(),
  category: z.enum([
    'Informed Consent',
    'Inclusion / Exclusion Criteria',
    'Visit Out of Window',
    'Investigational Product Dosing',
    'Prohibited Concomitant Medication',
    'Safety Reporting Timeline',
    'Laboratory Assessment',
    'Other',
  ]),
  description: z.string().min(3),
  severity: z.enum(['Minor', 'Major', 'Critical']),
  correctiveAction: z.string().optional(),
});

// GET /trials/:id/deviations
router.get('/trials/:id/deviations', requireTrialAccess, async (req, res, next) => {
  try {
    const devs = await ProtocolDeviation.find({ trialId: req.params.id })
      .populate('participantId', 'subjectId arm')
      .populate('reportedBy', 'name role')
      .sort({ reportedAt: -1 });
    res.status(200).json({ success: true, data: devs });
  } catch (err) {
    next(err);
  }
});

// POST /trials/:id/deviations
router.post('/trials/:id/deviations', requireTrialAccess, authorize(['admin', 'coordinator', 'investigator']), async (req, res, next) => {
  try {
    const trialId = req.params.id;
    const parse = deviationSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid deviation input', details: parse.error.issues },
      });
    }

    const dev = await ProtocolDeviation.create({
      ...parse.data,
      trialId,
      reportedBy: req.user._id,
      reportedAt: new Date(),
    });

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'ProtocolDeviation',
      entityId: dev._id,
      action: 'CREATE',
      before: null,
      after: dev.toObject(),
      req,
    });

    res.status(201).json({ success: true, data: dev });
  } catch (err) {
    next(err);
  }
});

// --- Data Queries ---
const querySchema = z.object({
  participantId: z.string().optional(),
  field: z.string().min(2),
  queryText: z.string().min(3),
  dueDays: z.number().optional().default(14),
});

// GET /trials/:id/queries
router.get('/trials/:id/queries', requireTrialAccess, async (req, res, next) => {
  try {
    const queries = await DataQuery.find({ trialId: req.params.id })
      .populate('participantId', 'subjectId')
      .populate('raisedBy', 'name role')
      .populate('answeredBy', 'name role')
      .sort({ raisedAt: -1 });
    res.status(200).json({ success: true, data: queries });
  } catch (err) {
    next(err);
  }
});

// POST /trials/:id/queries
router.post('/trials/:id/queries', requireTrialAccess, authorize(['admin', 'coordinator', 'investigator']), async (req, res, next) => {
  try {
    const trialId = req.params.id;
    const parse = querySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid query input', details: parse.error.issues },
      });
    }

    const data = parse.data;
    const raisedAt = new Date();
    const dueAt = new Date(raisedAt.getTime() + data.dueDays * 24 * 60 * 60 * 1000);

    const query = await DataQuery.create({
      trialId,
      participantId: data.participantId || null,
      field: data.field,
      queryText: data.queryText,
      raisedAt,
      dueAt,
      raisedBy: req.user._id,
      status: 'Open',
    });

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'DataQuery',
      entityId: query._id,
      action: 'CREATE',
      before: null,
      after: query.toObject(),
      req,
    });

    res.status(201).json({ success: true, data: query });
  } catch (err) {
    next(err);
  }
});

// PATCH /queries/:id (Answer or Close)
router.patch('/queries/:id', authorize(['admin', 'coordinator', 'investigator']), async (req, res, next) => {
  try {
    const query = await DataQuery.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Query not found' } });
    }

    const before = query.toObject();
    const { status, answerText } = req.body;

    if (answerText) {
      query.answerText = answerText;
      query.answeredAt = new Date();
      query.answeredBy = req.user._id;
      query.status = 'Answered';
    }

    if (status) {
      query.status = status;
      if (status === 'Closed') {
        query.closedAt = new Date();
      }
    }

    await query.save();

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'DataQuery',
      entityId: query._id,
      action: 'UPDATE',
      before,
      after: query.toObject(),
      req,
    });

    res.status(200).json({ success: true, data: query });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
