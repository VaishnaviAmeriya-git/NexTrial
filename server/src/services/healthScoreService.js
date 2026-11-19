const { Participant, Visit, AdverseEvent, DataQuery, Settings } = require('../models');

/**
 * Calculates the exact composite Trial Health Score (THS)
 * THS = 100 * (0.25 E + 0.25 R + 0.20 C + 0.15 S + 0.15 Q)
 */
async function calculateTrialHealthScore(trial) {
  // Load configurable weights from settings or use defaults
  const settings = await Settings.findOne({ key: 'global_ctms_settings' });
  const weights = settings?.trialHealthScoreWeights || {
    enrollment: 0.25,
    retention: 0.25,
    compliance: 0.20,
    safety: 0.15,
    quality: 0.15,
  };

  const trialId = trial._id;

  // 1. Enrollment (E) = min(1, enrolled / expectedEnrolledByNow)
  const totalEnrolled = await Participant.countDocuments({
    trialId,
    status: { $in: ['Enrolled', 'Active', 'Completed', 'Withdrawn', 'Lost to follow-up'] },
  });

  // Determine expected enrolled by now based on trial duration and target
  let expectedByNow = trial.targetEnrollment;
  if (trial.startDate && trial.expectedEnrollmentDate) {
    const totalDuration = new Date(trial.expectedEnrollmentDate) - new Date(trial.startDate);
    const elapsed = Date.now() - new Date(trial.startDate);
    if (totalDuration > 0 && elapsed > 0) {
      const progressFraction = Math.min(1.0, elapsed / totalDuration);
      expectedByNow = Math.max(1, Math.round(trial.targetEnrollment * progressFraction));
    }
  } else {
    // If dates not set, default expectedByNow to target enrollment
    expectedByNow = Math.max(1, trial.targetEnrollment);
  }

  const rawE = Math.min(1.0, totalEnrolled / expectedByNow);
  const E = Math.max(0.0, rawE);

  // 2. Retention (R) = 1 - (dropouts / enrolled)
  const dropouts = await Participant.countDocuments({
    trialId,
    status: { $in: ['Withdrawn', 'Lost to follow-up'] },
  });
  const rawR = totalEnrolled > 0 ? 1.0 - dropouts / totalEnrolled : 1.0;
  const R = Math.max(0.0, Math.min(1.0, rawR));

  // 3. Compliance (C) = visits completed in window / visits due
  const now = new Date();
  const visitsDue = await Visit.countDocuments({
    trialId,
    scheduledDate: { $lte: now },
  });
  const visitsCompletedInWindow = await Visit.countDocuments({
    trialId,
    status: 'Completed',
  });
  const rawC = visitsDue > 0 ? visitsCompletedInWindow / visitsDue : 1.0;
  const C = Math.max(0.0, Math.min(1.0, rawC));

  // 4. Safety (S) = 1 - min(1, (SAE + 0.3 * severeAE) / enrolled * 5)
  const saeCount = await AdverseEvent.countDocuments({
    trialId,
    serious: true,
  });
  const severeAeCount = await AdverseEvent.countDocuments({
    trialId,
    serious: false,
    severity: 'Severe',
  });
  const safetyPenalty =
    totalEnrolled > 0 ? ((saeCount + 0.3 * severeAeCount) / totalEnrolled) * 5.0 : 0.0;
  const rawS = 1.0 - Math.min(1.0, safetyPenalty);
  const S = Math.max(0.0, Math.min(1.0, rawS));

  // 5. Quality (Q) = 1 - (overdueQueries / totalQueries) (1 if none)
  const totalQueries = await DataQuery.countDocuments({ trialId });
  const overdueQueries = await DataQuery.countDocuments({
    trialId,
    status: 'Open',
    dueAt: { $lt: now },
  });
  const rawQ = totalQueries > 0 ? 1.0 - overdueQueries / totalQueries : 1.0;
  const Q = Math.max(0.0, Math.min(1.0, rawQ));

  // Compute composite score
  const score = Math.round(
    100 *
      (weights.enrollment * E +
        weights.retention * R +
        weights.compliance * C +
        weights.safety * S +
        weights.quality * Q)
  );

  let band = 'green';
  let bandLabel = 'Healthy';
  let plainExplanation = 'Trial execution is within healthy operational and safety parameters.';
  if (score >= 80) {
    band = 'green';
    bandLabel = 'Healthy (>=80)';
    plainExplanation = 'Trial enrollment, retention, and participant safety exceed GCP quality thresholds.';
  } else if (score >= 60) {
    band = 'amber';
    bandLabel = 'Moderate Attention Required (60-79)';
    plainExplanation = 'Trial exhibits moderate friction in visit attendance, queries, or enrollment velocity.';
  } else {
    band = 'red';
    bandLabel = 'Critical Risk (<60)';
    plainExplanation = 'Immediate coordinator intervention required due to high dropouts, SAE occurrence, or overdue compliance.';
  }

  return {
    score,
    band,
    bandLabel,
    plainExplanation,
    breakdown: [
      {
        metric: 'E',
        name: 'Enrollment Velocity',
        value: Number(E.toFixed(3)),
        weight: weights.enrollment,
        points: Number((weights.enrollment * E * 100).toFixed(1)),
        details: `${totalEnrolled} enrolled vs ${expectedByNow} target expected by now`,
      },
      {
        metric: 'R',
        name: 'Retention Rate',
        value: Number(R.toFixed(3)),
        weight: weights.retention,
        points: Number((weights.retention * R * 100).toFixed(1)),
        details: `${totalEnrolled - dropouts} active participants out of ${totalEnrolled} enrolled (${dropouts} dropped out)`,
      },
      {
        metric: 'C',
        name: 'Protocol Visit Compliance',
        value: Number(C.toFixed(3)),
        weight: weights.compliance,
        points: Number((weights.compliance * C * 100).toFixed(1)),
        details: `${visitsCompletedInWindow} completed in-window of ${visitsDue} scheduled visits due`,
      },
      {
        metric: 'S',
        name: 'Safety & AE Mitigation',
        value: Number(S.toFixed(3)),
        weight: weights.safety,
        points: Number((weights.safety * S * 100).toFixed(1)),
        details: `${saeCount} SAEs and ${severeAeCount} severe AEs reported across cohort`,
      },
      {
        metric: 'Q',
        name: 'Data Quality & Queries',
        value: Number(Q.toFixed(3)),
        weight: weights.quality,
        points: Number((weights.quality * Q * 100).toFixed(1)),
        details: `${overdueQueries} overdue queries out of ${totalQueries} total data queries`,
      },
    ],
  };
}

module.exports = { calculateTrialHealthScore };
