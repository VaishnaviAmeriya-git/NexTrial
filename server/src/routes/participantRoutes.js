const express = require('express');
const { z } = require('zod');
const { Participant, Trial, Visit, Consent, RiskPrediction, AdverseEvent } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess, authorize } = require('../middleware/rbac');
const { recordAudit } = require('../middleware/audit');
const MLClient = require('../services/mlClient');

const router = express.Router();

router.use(authenticate);

const participantSchema = z.object({
  age: z.number().int().min(18).max(100),
  sex: z.enum(['Male', 'Female', 'Other']),
  distanceKm: z.number().min(0),
  arm: z.string().optional(),
  ayurveda: z.object({
    prakriti: z.enum(['vata', 'pitta', 'kapha', 'vata-pitta', 'pitta-kapha', 'vata-kapha', 'sama']),
    doshaImbalance: z.array(z.string()).optional(),
    ayurvedicDiagnosis: z.string().min(2),
    biomedicalDiagnosis: z.string().optional(),
    formulation: z.string().min(2),
    dosage: z.string().optional(),
    procedure: z.string().optional(),
    durationDays: z.number().optional(),
  }),
});

// GET /trials/:id/participants
router.get('/trials/:id/participants', requireTrialAccess, async (req, res, next) => {
  try {
    const trialId = req.params.id;
    const { status, prakriti, riskBand, search } = req.query;

    const query = { trialId };
    if (status) query.status = status;
    if (prakriti) query['ayurveda.prakriti'] = prakriti;
    if (search) {
      query.subjectId = { $regex: search, $options: 'i' };
    }

    const participants = await Participant.find(query).sort({ createdAt: -1 });

    // Attach latest risk prediction band if available
    const participantIds = participants.map(p => p._id);
    const risks = await RiskPrediction.find({ participantId: { $in: participantIds } });
    const riskMap = new Map(risks.map(r => [r.participantId.toString(), r]));

    let results = participants.map(p => {
      const obj = p.toObject();
      const r = riskMap.get(p._id.toString());
      obj.latestRisk = r ? { probability: r.probability, band: r.band, topFactors: r.topFactors } : null;
      return obj;
    });

    if (riskBand) {
      results = results.filter(p => p.latestRisk?.band === riskBand);
    }

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

// POST /trials/:id/participants
router.post('/trials/:id/participants', requireTrialAccess, authorize(['admin', 'coordinator']), async (req, res, next) => {
  try {
    const trialId = req.params.id;
    const trial = await Trial.findById(trialId);
    if (!trial) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trial not found' } });
    }

    const parse = participantSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid participant payload', details: parse.error.issues },
      });
    }

    // Generate unique subjectId pseudonym: e.g. NT01-0042
    const count = await Participant.countDocuments({ trialId });
    const trialPrefix = trial.shortCode.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase();
    const subjectId = `${trialPrefix}-${String(count + 1).padStart(4, '0')}`;

    const participantData = {
      ...parse.data,
      trialId,
      subjectId,
      status: 'Screened',
      enrolledAt: new Date(),
      consentStatus: 'Pending',
    };

    const participant = await Participant.create(participantData);

    // Automatically generate visits from trial's visit schedule
    const enrollmentDate = new Date();
    const visits = (trial.visitSchedule || []).map(vs => {
      const scheduled = new Date(enrollmentDate.getTime() + vs.dayOffset * 24 * 60 * 60 * 1000);
      const wStart = new Date(scheduled.getTime() - vs.windowDays * 24 * 60 * 60 * 1000);
      const wEnd = new Date(scheduled.getTime() + vs.windowDays * 24 * 60 * 60 * 1000);
      return {
        participantId: participant._id,
        trialId: trial._id,
        visitNo: vs.visitNo,
        visitName: vs.name,
        scheduledDate: scheduled,
        windowStart: wStart,
        windowEnd: wEnd,
        status: vs.visitNo === 1 ? 'Scheduled' : 'Scheduled',
      };
    });

    if (visits.length > 0) {
      await Visit.insertMany(visits);
    }

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'Participant',
      entityId: participant._id,
      action: 'CREATE',
      before: null,
      after: participant.toObject(),
      req,
    });

    res.status(201).json({ success: true, data: participant });
  } catch (err) {
    next(err);
  }
});

// GET /participants/:id
router.get('/participants/:id', async (req, res, next) => {
  try {
    const participant = await Participant.findById(req.params.id).populate('trialId', 'title shortCode formulation condition');
    if (!participant) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Participant not found' } });
    }

    const [visits, consent, latestRisk, adverseEvents] = await Promise.all([
      Visit.find({ participantId: participant._id }).sort({ visitNo: 1 }),
      Consent.findOne({ participantId: participant._id }).sort({ signedAt: -1 }),
      RiskPrediction.findOne({ participantId: participant._id }).sort({ computedAt: -1 }),
      AdverseEvent.find({ participantId: participant._id }).sort({ reportedAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        participant,
        visits,
        consent,
        latestRisk,
        adverseEvents,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /participants/:id
router.patch('/participants/:id', authorize(['admin', 'coordinator', 'investigator']), async (req, res, next) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Participant not found' } });
    }

    const before = participant.toObject();
    if (req.body.age) participant.age = req.body.age;
    if (req.body.distanceKm) participant.distanceKm = req.body.distanceKm;
    if (req.body.arm) participant.arm = req.body.arm;
    if (req.body.ayurveda) {
      participant.ayurveda = { ...participant.ayurveda.toObject(), ...req.body.ayurveda };
    }

    await participant.save();

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'Participant',
      entityId: participant._id,
      action: 'UPDATE',
      before,
      after: participant.toObject(),
      req,
    });

    res.status(200).json({ success: true, data: participant });
  } catch (err) {
    next(err);
  }
});

// POST /participants/:id/consent
router.post('/participants/:id/consent', authorize(['admin', 'coordinator']), async (req, res, next) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Participant not found' } });
    }

    const { action, method, version, witnessName, withdrawalReason } = req.body;

    if (action === 'withdraw') {
      const consent = await Consent.findOne({ participantId: participant._id }).sort({ signedAt: -1 });
      if (consent) {
        consent.withdrawnAt = new Date();
        consent.withdrawalReason = withdrawalReason || 'Participant self-withdrawal';
        await consent.save();
      }
      participant.consentStatus = 'Withdrawn';
      participant.status = 'Withdrawn';
      participant.dropout = { date: new Date(), reason: withdrawalReason || 'Consent withdrawn' };
      await participant.save();

      await recordAudit({
        who: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        entity: 'Consent',
        entityId: participant._id,
        action: 'CONSENT_WITHDRAWAL',
        before: { consentStatus: 'Signed' },
        after: { consentStatus: 'Withdrawn', reason: withdrawalReason },
        req,
      });

      return res.status(200).json({ success: true, message: 'Consent withdrawn successfully', participant });
    }

    // Record new consent
    const consent = await Consent.create({
      participantId: participant._id,
      trialId: participant.trialId,
      version: version || '1.0',
      method: method || 'Written Paper',
      witnessName: witnessName || '',
      signedAt: new Date(),
    });

    participant.consentStatus = 'Signed';
    if (participant.status === 'Screened') {
      participant.status = 'Enrolled';
    }
    await participant.save();

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'Consent',
      entityId: consent._id,
      action: 'CREATE',
      before: null,
      after: consent.toObject(),
      req,
    });

    res.status(200).json({ success: true, data: { consent, participant } });
  } catch (err) {
    next(err);
  }
});

// POST /participants/:id/status
router.post('/participants/:id/status', authorize(['admin', 'investigator']), async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Participant not found' } });
    }

    const beforeStatus = participant.status;
    participant.status = status;
    if (status === 'Withdrawn' || status === 'Lost to follow-up') {
      participant.dropout = { date: new Date(), reason: reason || 'Investigator recorded status transition' };
    }
    await participant.save();

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'Participant',
      entityId: participant._id,
      action: 'STATUS_CHANGE',
      before: { status: beforeStatus },
      after: { status, reason },
      req,
    });

    res.status(200).json({ success: true, data: participant });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
