const { Trial, Participant, AdverseEvent } = require('../models');

class CDISCService {
  /**
   * Helper to format rows as CSV
   */
  static toCSV(headers, rows) {
    const escape = val => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const headerLine = headers.map(escape).join(',');
    const bodyLines = rows.map(row => headers.map(h => escape(row[h])).join(','));
    return [headerLine, ...bodyLines].join('\n');
  }

  /**
   * Generates CDISC SDTM-inspired datasets (DM, AE, EX, and AY custom domains)
   */
  static async exportTrialAsCDISC(trialId) {
    const trial = await Trial.findById(trialId);
    if (!trial) throw new Error('Trial not found');

    const participants = await Participant.find({ trialId });
    const adverseEvents = await AdverseEvent.find({ trialId });

    const studyId = trial.shortCode;

    // 1. Demographics (DM)
    const dmHeaders = ['STUDYID', 'USUBJID', 'SUBJID', 'AGE', 'SEX', 'ARM', 'ACTARM', 'ENRLDT', 'COUNTRY'];
    const dmRows = participants.map(p => ({
      STUDYID: studyId,
      USUBJID: `${studyId}-${p.subjectId}`,
      SUBJID: p.subjectId,
      AGE: p.age,
      SEX: p.sex ? p.sex.charAt(0).toUpperCase() : 'U',
      ARM: p.arm,
      ACTARM: p.arm,
      ENRLDT: p.enrolledAt ? new Date(p.enrolledAt).toISOString().split('T')[0] : '',
      COUNTRY: 'IND',
    }));
    const dmCSV = this.toCSV(dmHeaders, dmRows);

    // 2. Adverse Events (AE)
    const aeHeaders = ['STUDYID', 'USUBJID', 'AETERM', 'AEDECOD', 'AEBODSYS', 'AESTDTC', 'AESER', 'AESEV', 'AEREL', 'AEOUT'];
    const participantMap = new Map(participants.map(p => [p._id.toString(), p.subjectId]));
    const aeRows = adverseEvents.map(ae => ({
      STUDYID: studyId,
      USUBJID: `${studyId}-${participantMap.get(ae.participantId.toString()) || 'UNKNOWN'}`,
      AETERM: ae.verbatimTerm,
      AEDECOD: ae.coded?.pt || 'UNCODED',
      AEBODSYS: ae.coded?.soc || 'UNCODED',
      AESTDTC: ae.onsetDate ? new Date(ae.onsetDate).toISOString().split('T')[0] : '',
      AESER: ae.serious ? 'Y' : 'N',
      AESEV: ae.severity ? ae.severity.toUpperCase() : 'MILD',
      AEREL: ae.causality ? ae.causality.toUpperCase() : 'POSSIBLE',
      AEOUT: ae.outcome ? ae.outcome.toUpperCase() : 'RECOVERING',
    }));
    const aeCSV = this.toCSV(aeHeaders, aeRows);

    // 3. Exposure (EX)
    const exHeaders = ['STUDYID', 'USUBJID', 'EXTRT', 'EXDOSE', 'EXDOSU', 'EXROUTE', 'EXSTDTC'];
    const exRows = participants.map(p => ({
      STUDYID: studyId,
      USUBJID: `${studyId}-${p.subjectId}`,
      EXTRT: p.ayurveda?.formulation || trial.formulation,
      EXDOSE: p.ayurveda?.dosage || '1 tablet bid',
      EXDOSU: 'TABLET',
      EXROUTE: 'ORAL',
      EXSTDTC: p.enrolledAt ? new Date(p.enrolledAt).toISOString().split('T')[0] : '',
    }));
    const exCSV = this.toCSV(exHeaders, exRows);

    // 4. Custom Ayurvedic Domain (AY)
    const ayHeaders = ['STUDYID', 'USUBJID', 'AYPRAKR', 'AYDOSHA', 'AYDIAG', 'AYFORM', 'AYPROC', 'AYDUR'];
    const ayRows = participants.map(p => ({
      STUDYID: studyId,
      USUBJID: `${studyId}-${p.subjectId}`,
      AYPRAKR: p.ayurveda?.prakriti || 'sama',
      AYDOSHA: (p.ayurveda?.doshaImbalance || []).join('; '),
      AYDIAG: p.ayurveda?.ayurvedicDiagnosis || '',
      AYFORM: p.ayurveda?.formulation || '',
      AYPROC: p.ayurveda?.procedure || 'Oral administration',
      AYDUR: p.ayurveda?.durationDays || 90,
    }));
    const ayCSV = this.toCSV(ayHeaders, ayRows);

    return {
      trialCode: trial.shortCode,
      datasets: {
        DM: dmCSV,
        AE: aeCSV,
        EX: exCSV,
        AY: ayCSV,
      },
    };
  }
}

module.exports = CDISCService;
