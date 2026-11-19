const express = require('express');
const { z } = require('zod');
const { AdverseEvent, Participant, Trial, Alert, Settings } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess, authorize } = require('../middleware/rbac');
const { recordAudit } = require('../middleware/audit');
const { CodingService } = require('../services/codingService');

const router = express.Router();

router.use(authenticate);

const aeSchema = z.object({
  participantId: z.string(),
  onsetDate: z.string(),
  verbatimTerm: z.string().min(2),
  severity: z.enum(['Mild', 'Moderate', 'Severe']),
  serious: z.boolean(),
  seriousCriteria: z.array(z.string()).optional(),
  causality: z.enum(['Certain', 'Probable', 'Possible', 'Unlikely', 'Unassessable']).optional(),
  expected: z.boolean().optional(),
  outcome: z.enum(['Recovered', 'Recovering', 'Not Recovered', 'Recovered with Sequelae', 'Fatal', 'Unknown']).optional(),
  actionTaken: z.enum(['None', 'Dose Reduced', 'Drug Interrupted', 'Drug Withdrawn', 'Not Applicable']).optional(),
  suspectedFormulation: z.string().min(2),
});

// GET /trials/:id/adverse-events
router.get('/trials/:id/adverse-events', requireTrialAccess, async (req, res, next) => {
  try {
    const trialId = req.params.id;
    const { serious, severity, status } = req.query;

    const query = { trialId };
    if (serious !== undefined) query.serious = serious === 'true';
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const aes = await AdverseEvent.find(query)
      .populate('participantId', 'subjectId age sex arm ayurveda')
      .sort({ reportedAt: -1 });

    res.status(200).json({ success: true, data: aes });
  } catch (err) {
    next(err);
  }
});

// POST /trials/:id/adverse-events
router.post('/trials/:id/adverse-events', requireTrialAccess, authorize(['admin', 'investigator']), async (req, res, next) => {
  try {
    const trialId = req.params.id;
    const trial = await Trial.findById(trialId);
    if (!trial) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trial not found' } });
    }

    const parse = aeSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid AE input', details: parse.error.issues },
      });
    }

    const data = parse.data;
    const reportedAt = new Date();

    // Auto-suggest coding from demo dictionary
    const suggested = CodingService.suggestCoding(data.verbatimTerm);

    // Calculate regulatory deadlines for SAE
    let deadlines = { initialDue: null, detailedDue: null };
    if (data.serious) {
      const settings = await Settings.findOne({ key: 'global_ctms_settings' });
      const initHours = settings?.regulatoryTimelines?.saeInitialReportDueHours || 24;
      const detDays = settings?.regulatoryTimelines?.saeDetailedReportDueDays || 14;

      deadlines.initialDue = new Date(reportedAt.getTime() + initHours * 60 * 60 * 1000);
      deadlines.detailedDue = new Date(reportedAt.getTime() + detDays * 24 * 60 * 60 * 1000);
    }

    const ae = await AdverseEvent.create({
      ...data,
      trialId,
      reportedAt,
      coded: {
        soc: suggested.soc,
        pt: suggested.pt,
        code: suggested.code,
        dictionaryVersion: 'DEMO-MedDRA-v1',
      },
      deadlines,
      status: 'Open',
    });

    // If SAE, trigger critical regulatory alert immediately
    if (data.serious) {
      await Alert.create({
        type: 'SAE_REPORT_DUE',
        trialId,
        participantId: data.participantId,
        severity: 'danger',
        message: `SAE Recorded: '${data.verbatimTerm}'. 24-hour initial regulatory report due to IEC by ${deadlines.initialDue.toLocaleTimeString()} on ${deadlines.initialDue.toLocaleDateString()}.`,
        status: 'open',
      });
    }

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'AdverseEvent',
      entityId: ae._id,
      action: 'CREATE',
      before: null,
      after: ae.toObject(),
      req,
    });

    res.status(201).json({ success: true, data: ae });
  } catch (err) {
    next(err);
  }
});

// PATCH /adverse-events/:id
router.patch('/adverse-events/:id', authorize(['admin', 'investigator', 'pv_officer']), async (req, res, next) => {
  try {
    const ae = await AdverseEvent.findById(req.params.id);
    if (!ae) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Adverse event not found' } });
    }

    const before = ae.toObject();
    const fields = [
      'severity',
      'serious',
      'seriousCriteria',
      'causality',
      'expected',
      'outcome',
      'actionTaken',
      'status',
      'reportedTo',
    ];

    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'reportedTo') {
          ae.reportedTo = { ...ae.reportedTo, ...req.body.reportedTo };
        } else {
          ae[f] = req.body[f];
        }
      }
    });

    await ae.save();

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'AdverseEvent',
      entityId: ae._id,
      action: 'UPDATE',
      before,
      after: ae.toObject(),
      req,
    });

    res.status(200).json({ success: true, data: ae });
  } catch (err) {
    next(err);
  }
});

// POST /adverse-events/:id/code (MedDRA / Ayurvedic coding)
router.post('/adverse-events/:id/code', authorize(['admin', 'pv_officer']), async (req, res, next) => {
  try {
    const ae = await AdverseEvent.findById(req.params.id);
    if (!ae) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Adverse event not found' } });
    }

    const { soc, pt, code, dictionaryVersion } = req.body;
    const before = ae.coded;

    ae.coded = {
      soc: soc || ae.coded.soc,
      pt: pt || ae.coded.pt,
      code: code || ae.coded.code,
      dictionaryVersion: dictionaryVersion || 'DEMO-MedDRA-v1',
    };
    ae.status = 'Coded';
    await ae.save();

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'AdverseEvent',
      entityId: ae._id,
      action: 'CODE_AE',
      before,
      after: ae.coded,
      req,
    });

    res.status(200).json({ success: true, data: ae });
  } catch (err) {
    next(err);
  }
});

// GET /trials/:id/safety-signals (DSMB Aggregate safety view)
router.get('/trials/:id/safety-signals', requireTrialAccess, authorize(['admin', 'dsmb', 'investigator', 'pv_officer']), async (req, res, next) => {
  try {
    const trialId = req.params.id;
    const aes = await AdverseEvent.find({ trialId });
    const participantsCount = await Participant.countDocuments({ trialId });

    const totalAE = aes.length;
    const seriousAE = aes.filter(a => a.serious).length;
    const nonSeriousAE = totalAE - seriousAE;

    // SOC distribution
    const socCounts = {};
    const causalityCounts = {};
    const severityCounts = { Mild: 0, Moderate: 0, Severe: 0 };

    aes.forEach(a => {
      const soc = a.coded?.soc || 'Uncoded';
      socCounts[soc] = (socCounts[soc] || 0) + 1;

      const caus = a.causality || 'Unassessable';
      causalityCounts[caus] = (causalityCounts[caus] || 0) + 1;

      if (a.severity) {
        severityCounts[a.severity] = (severityCounts[a.severity] || 0) + 1;
      }
    });

    const saeIncidencePct = participantsCount > 0 ? Number(((seriousAE / participantsCount) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalAE,
        seriousAE,
        nonSeriousAE,
        saeIncidencePct,
        socDistribution: Object.entries(socCounts).map(([soc, count]) => ({ soc, count })),
        causalityDistribution: Object.entries(causalityCounts).map(([causality, count]) => ({ causality, count })),
        severityDistribution: severityCounts,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /dictionary/search (Expose demo MedDRA & Ayurvedic formulations for autocomplete)
router.get('/dictionary/meddra', (req, res) => {
  const query = req.query.q || '';
  const results = CodingService.searchMedDRA(query);
  res.status(200).json({ success: true, data: results });
});

router.get('/dictionary/ayurvedic', (req, res) => {
  const query = req.query.q || '';
  const results = CodingService.searchAyurvedic(query);
  res.status(200).json({ success: true, data: results });
});

module.exports = router;
