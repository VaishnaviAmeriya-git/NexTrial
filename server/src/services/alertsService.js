const {
  Alert,
  Trial,
  EthicsApproval,
  AdverseEvent,
  Visit,
  DataQuery,
  Participant,
  Settings,
} = require('../models');

class AlertsService {
  /**
   * Run automated audit and generate alerts across all trials
   */
  static async runAlertChecks() {
    try {
      const now = new Date();
      const settings = await Settings.findOne({ key: 'global_ctms_settings' });
      const iecWarningDays = settings?.regulatoryTimelines?.iecExpiryWarningDays || 30;
      const queryOverdueDays = settings?.regulatoryTimelines?.queryOverdueDays || 14;

      const trials = await Trial.find({ status: { $ne: 'Closed' } });

      for (const trial of trials) {
        // 1. CTRI number missing for an Active trial
        if (trial.status === 'Active' && (!trial.ctri || !trial.ctri.number)) {
          await this.createAlertIfNotExists({
            type: 'CTRI_MISSING_FOR_ACTIVE_TRIAL',
            trialId: trial._id,
            severity: 'danger',
            message: `Trial '${trial.shortCode}' is Active but lacks a mandatory CTRI registration number.`,
          });
        }

        // 2. IEC approval expires within 30 days
        const warningThreshold = new Date(now.getTime() + iecWarningDays * 24 * 60 * 60 * 1000);
        const expiringEthics = await EthicsApproval.find({
          trialId: trial._id,
          validUntil: { $lte: warningThreshold },
          status: 'Active',
        });
        for (const eth of expiringEthics) {
          const daysLeft = Math.ceil((new Date(eth.validUntil) - now) / (1000 * 60 * 60 * 24));
          await this.createAlertIfNotExists({
            type: 'IEC_EXPIRY_WARNING',
            trialId: trial._id,
            severity: daysLeft <= 7 ? 'danger' : 'warning',
            message: `Ethics approval '${eth.approvalNo}' expires in ${daysLeft} days (on ${new Date(eth.validUntil).toLocaleDateString()}). Initiate continuing review.`,
          });
        }

        // 3. SAE initial report due and not reported (within 24 hours of onset/report)
        const unreportedSAEs = await AdverseEvent.find({
          trialId: trial._id,
          serious: true,
          'reportedTo.iec': null,
        });
        for (const sae of unreportedSAEs) {
          const hoursElapsed = Math.round((now - new Date(sae.reportedAt)) / (1000 * 60 * 60));
          await this.createAlertIfNotExists({
            type: 'SAE_REPORT_DUE',
            trialId: trial._id,
            participantId: sae.participantId,
            severity: 'danger',
            message: `URGENT: Serious Adverse Event (${sae.verbatimTerm}) for participant has elapsed ${hoursElapsed} hours without confirmed IEC notification. 24-hour clock active.`,
          });
        }

        // 4. Visit overdue past window
        const overdueVisits = await Visit.find({
          trialId: trial._id,
          status: 'Scheduled',
          windowEnd: { $lt: now },
        }).limit(20);
        for (const visit of overdueVisits) {
          await this.createAlertIfNotExists({
            type: 'VISIT_OVERDUE',
            trialId: trial._id,
            participantId: visit.participantId,
            severity: 'warning',
            message: `Scheduled Visit ${visit.visitNo} is overdue past allowable protocol window (${new Date(visit.windowEnd).toLocaleDateString()}). Mark missed or reschedule.`,
          });
        }

        // 5. Query open longer than 14 days
        const overdueThreshold = new Date(now.getTime() - queryOverdueDays * 24 * 60 * 60 * 1000);
        const overdueQueries = await DataQuery.find({
          trialId: trial._id,
          status: 'Open',
          raisedAt: { $lt: overdueThreshold },
        });
        for (const q of overdueQueries) {
          await this.createAlertIfNotExists({
            type: 'QUERY_OVERDUE',
            trialId: trial._id,
            participantId: q.participantId,
            severity: 'warning',
            message: `Data query on field '${q.field}' has remained open for over ${queryOverdueDays} days without coordinator response.`,
          });
        }
      }
    } catch (err) {
      console.error('[AlertsService] Error running alert audit checks:', err.message);
    }
  }

  static async createAlertIfNotExists({ type, trialId, participantId, severity, message }) {
    const existing = await Alert.findOne({
      type,
      trialId,
      participantId: participantId || null,
      status: 'open',
    });
    if (!existing) {
      await Alert.create({
        type,
        trialId,
        participantId: participantId || null,
        severity,
        message,
        status: 'open',
      });
    }
  }
}

module.exports = AlertsService;
