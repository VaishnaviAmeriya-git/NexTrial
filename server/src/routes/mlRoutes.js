const express = require('express');
const { Participant, Visit, AdverseEvent, RiskPrediction, Alert, Trial } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireTrialAccess, authorize } = require('../middleware/rbac');
const { recordAudit } = require('../middleware/audit');
const MLClient = require('../services/mlClient');

const router = express.Router();

router.use(authenticate);

// Helper to extract strictly pre-prediction point features (Visit 1 to 3)
async function extractParticipantFeatures(participant) {
  // Strict cutoff: only visits 1, 2, 3
  const earlyVisits = await Visit.find({
    participantId: participant._id,
    visitNo: { $lte: 3 },
  });

  const missedVisits = earlyVisits.filter(v => v.status === 'Missed').length;
  const completedVisits = earlyVisits.filter(v => v.status === 'Completed').length;
  const totalEarly = earlyVisits.length || 1;
  const compliancePct = Math.round((completedVisits / totalEarly) * 100);

  // Adverse events on or before Visit 3 date (or day 35)
  const cutoffDate = earlyVisits[earlyVisits.length - 1]?.scheduledDate || new Date();
  const earlyAEs = await AdverseEvent.find({
    participantId: participant._id,
    onsetDate: { $lte: cutoffDate },
  });

  const aeCount = earlyAEs.length;
  let maxSev = 0;
  earlyAEs.forEach(a => {
    if (a.severity === 'Severe') maxSev = Math.max(maxSev, 3);
    else if (a.severity === 'Moderate') maxSev = Math.max(maxSev, 2);
    else if (a.severity === 'Mild') maxSev = Math.max(maxSev, 1);
  });

  return {
    participantId: participant.subjectId,
    age: participant.age,
    sex: participant.sex,
    distance_km: participant.distanceKm,
    missed_visits_so_far: missedVisits,
    visit_compliance_pct: compliancePct,
    ae_count: aeCount,
    ae_max_severity: maxSev,
  };
}

// POST /participants/:id/risk
router.post('/participants/:id/risk', authorize(['admin', 'investigator', 'coordinator']), async (req, res, next) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Participant not found' } });
    }

    const features = await extractParticipantFeatures(participant);
    const result = await MLClient.predictRisk(features);

    if (result.available && result.data) {
      const predData = result.data;

      // Persist in RiskPrediction collection
      const record = await RiskPrediction.create({
        participantId: participant._id,
        trialId: participant.trialId,
        asOfVisitNo: 3,
        probability: predData.probability,
        band: predData.band,
        topFactors: predData.topFactors,
        suggestedActions: predData.suggestedActions,
        modelVersion: predData.modelVersion,
        computedAt: new Date(),
      });

      // If High risk, trigger alert for coordinator
      if (predData.band === 'High') {
        const existingAlert = await Alert.findOne({
          type: 'HIGH_DROPOUT_RISK',
          participantId: participant._id,
          status: 'open',
        });
        if (!existingAlert) {
          await Alert.create({
            type: 'HIGH_DROPOUT_RISK',
            trialId: participant.trialId,
            participantId: participant._id,
            severity: 'warning',
            message: `Participant ${participant.subjectId} flagged with HIGH dropout risk (${Math.round(predData.probability * 100)}%). Early coordinator outreach recommended.`,
            status: 'open',
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          ...predData,
          predictionAvailable: true,
        },
      });
    }

    // Graceful degradation when ML service is offline
    res.status(200).json({
      success: true,
      data: {
        predictionAvailable: false,
        message: 'Prediction unavailable',
        participantId: participant.subjectId,
        probability: null,
        band: 'Unavailable',
        topFactors: [],
        suggestedActions: ['Prediction unavailable. Monitor participant using standard clinical protocol.'],
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /trials/:id/risk/refresh (Batch refresh)
router.post('/trials/:id/risk/refresh', requireTrialAccess, authorize(['admin', 'investigator']), async (req, res, next) => {
  try {
    const trialId = req.params.id;
    const participants = await Participant.find({
      trialId,
      status: { $in: ['Enrolled', 'Active'] },
    });

    let updatedCount = 0;
    for (const p of participants) {
      const features = await extractParticipantFeatures(p);
      const resRisk = await MLClient.predictRisk(features);
      if (resRisk.available && resRisk.data) {
        await RiskPrediction.findOneAndUpdate(
          { participantId: p._id },
          {
            trialId,
            asOfVisitNo: 3,
            probability: resRisk.data.probability,
            band: resRisk.data.band,
            topFactors: resRisk.data.topFactors,
            suggestedActions: resRisk.data.suggestedActions,
            modelVersion: resRisk.data.modelVersion,
            computedAt: new Date(),
          },
          { upsert: true }
        );
        updatedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Batch risk evaluation completed for ${updatedCount} active participants.`,
      count: updatedCount,
    });
  } catch (err) {
    next(err);
  }
});

// GET /ml/model-info
router.get('/ml/model-info', async (req, res, next) => {
  try {
    const info = await MLClient.getModelInfo();
    res.status(200).json({ success: true, data: info.data });
  } catch (err) {
    next(err);
  }
});

// POST /ml/retrain (Admin only)
router.post('/ml/retrain', authorize(['admin']), async (req, res, next) => {
  try {
    const axios = require('axios');
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const response = await axios.post(`${mlUrl}/train`, {}, { timeout: 4000 });

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'MLModel',
      entityId: 'v1.0-rf',
      action: 'RETRAIN',
      before: null,
      after: { triggeredAt: new Date() },
      req,
    });

    res.status(202).json({ success: true, data: response.data });
  } catch (err) {
    res.status(503).json({
      error: { code: 'ML_SERVICE_UNAVAILABLE', message: 'ML service unavailable for retraining' },
    });
  }
});

module.exports = router;
