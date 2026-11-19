const express = require('express');
const { Visit, Participant, Trial } = require('../models');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { recordAudit } = require('../middleware/audit');

const router = express.Router();

router.use(authenticate);

// GET /participants/:id/visits
router.get('/participants/:id/visits', async (req, res, next) => {
  try {
    const visits = await Visit.find({ participantId: req.params.id }).sort({ visitNo: 1 });
    res.status(200).json({ success: true, data: visits });
  } catch (err) {
    next(err);
  }
});

// POST /participants/:id/visits/generate
router.post('/participants/:id/visits/generate', authorize(['admin', 'coordinator']), async (req, res, next) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Participant not found' } });
    }

    const trial = await Trial.findById(participant.trialId);
    if (!trial) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trial not found' } });
    }

    // Remove existing scheduled visits
    await Visit.deleteMany({ participantId: participant._id });

    const baseDate = participant.enrolledAt || new Date();
    const visits = (trial.visitSchedule || []).map(vs => {
      const scheduled = new Date(baseDate.getTime() + vs.dayOffset * 24 * 60 * 60 * 1000);
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
        status: 'Scheduled',
      };
    });

    const created = await Visit.insertMany(visits);

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'Visit',
      entityId: participant._id,
      action: 'CREATE',
      before: null,
      after: { count: created.length },
      req,
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// PATCH /visits/:id
router.patch('/visits/:id', authorize(['admin', 'coordinator', 'investigator']), async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Visit not found' } });
    }

    const before = visit.toObject();
    const { status, actualDate, notes, vitalSigns, ayurvedicAssessments } = req.body;

    if (actualDate) {
      const actDate = new Date(actualDate);
      visit.actualDate = actDate;
      // Auto-detect out of window
      if (actDate < visit.windowStart || actDate > visit.windowEnd) {
        visit.status = 'Out-of-window';
      } else {
        visit.status = status || 'Completed';
      }
    } else if (status) {
      visit.status = status;
      if (status === 'Completed' && !visit.actualDate) {
        visit.actualDate = new Date();
      }
    }

    if (notes !== undefined) visit.notes = notes;
    if (vitalSigns) visit.vitalSigns = { ...visit.vitalSigns, ...vitalSigns };
    if (ayurvedicAssessments) {
      visit.ayurvedicAssessments = { ...visit.ayurvedicAssessments, ...ayurvedicAssessments };
    }

    await visit.save();

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'Visit',
      entityId: visit._id,
      action: 'UPDATE',
      before,
      after: visit.toObject(),
      req,
    });

    res.status(200).json({ success: true, data: visit });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
