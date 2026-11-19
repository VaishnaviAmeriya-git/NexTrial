const { Trial, Participant, AdverseEvent, Visit } = require('../models');

class FHIRService {
  /**
   * Export trial data as a standard FHIR R4 JSON Bundle
   */
  static async exportTrialAsFHIR(trialId) {
    const trial = await Trial.findById(trialId);
    if (!trial) throw new Error('Trial not found');

    const participants = await Participant.find({ trialId });
    const participantIds = participants.map(p => p._id);
    const adverseEvents = await AdverseEvent.find({ trialId });
    const visits = await Visit.find({ trialId: trial._id }).limit(200);

    const bundleEntries = [];

    // 1. ResearchStudy Resource
    bundleEntries.push({
      fullUrl: `urn:uuid:researchstudy-${trial._id}`,
      resource: {
        resourceType: 'ResearchStudy',
        id: trial._id.toString(),
        meta: {
          profile: ['http://hl7.org/fhir/StructureDefinition/ResearchStudy'],
          tag: [{ system: 'http://nextrial.org/export', code: 'prototype-synthetic' }],
        },
        identifier: [
          { system: 'http://ctri.nic.in', value: trial.ctri?.number || 'PENDING' },
          { system: 'http://nextrial.org/trial-code', value: trial.shortCode },
        ],
        title: trial.title,
        status: trial.status.toLowerCase(),
        condition: [{ text: trial.condition }],
        focus: [{ text: trial.formulation }],
      },
    });

    // 2. Patient & ResearchSubject Resources (Pseudonymised, no direct identifiers)
    for (const p of participants) {
      const patientId = `patient-${p._id}`;
      // FHIR Patient
      bundleEntries.push({
        fullUrl: `urn:uuid:${patientId}`,
        resource: {
          resourceType: 'Patient',
          id: p._id.toString(),
          identifier: [
            { system: 'http://nextrial.org/subject-id', value: p.subjectId },
          ],
          active: p.status !== 'Withdrawn',
          gender: p.sex.toLowerCase(),
          extension: [
            {
              url: 'http://nextrial.org/fhir/StructureDefinition/ayurveda-prakriti',
              valueString: p.ayurveda.prakriti,
            },
            {
              url: 'http://nextrial.org/fhir/StructureDefinition/ayurvedic-diagnosis',
              valueString: p.ayurveda.ayurvedicDiagnosis,
            },
          ],
        },
      });

      // FHIR ResearchSubject
      bundleEntries.push({
        fullUrl: `urn:uuid:researchsubject-${p._id}`,
        resource: {
          resourceType: 'ResearchSubject',
          id: `rs-${p._id}`,
          status: p.status.toLowerCase().replace(/\s+/g, '-'),
          study: { reference: `urn:uuid:researchstudy-${trial._id}` },
          individual: { reference: `urn:uuid:${patientId}` },
          assignedArm: p.arm,
        },
      });
    }

    // 3. AdverseEvent Resources
    for (const ae of adverseEvents) {
      bundleEntries.push({
        fullUrl: `urn:uuid:adverseevent-${ae._id}`,
        resource: {
          resourceType: 'AdverseEvent',
          id: ae._id.toString(),
          actuality: 'actual',
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/adverse-event-category',
                  code: 'product-use-error',
                  display: 'Adverse Event',
                },
              ],
            },
          ],
          event: {
            text: ae.verbatimTerm,
            coding: ae.coded?.code
              ? [
                  {
                    system: 'http://nextrial.org/terminology/demo-meddra',
                    code: ae.coded.code,
                    display: ae.coded.pt,
                  },
                ]
              : undefined,
          },
          subject: { reference: `urn:uuid:patient-${ae.participantId}` },
          date: ae.onsetDate ? ae.onsetDate.toISOString() : undefined,
          seriousness: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/adverse-event-seriousness',
                code: ae.serious ? 'serious' : 'non-serious',
              },
            ],
          },
          suspectEntity: [
            {
              instance: { display: ae.suspectedFormulation },
              causality: [
                {
                  assessment: { text: ae.causality },
                },
              ],
            },
          ],
        },
      });
    }

    // 4. Observation Resources (Visits)
    for (const v of visits) {
      bundleEntries.push({
        fullUrl: `urn:uuid:observation-${v._id}`,
        resource: {
          resourceType: 'Observation',
          id: v._id.toString(),
          status: 'final',
          code: { text: `Visit ${v.visitNo} Attendance Assessment` },
          subject: { reference: `urn:uuid:patient-${v.participantId}` },
          effectiveDateTime: (v.actualDate || v.scheduledDate).toISOString(),
          valueString: v.status,
          note: v.notes ? [{ text: v.notes }] : undefined,
        },
      });
    }

    return {
      resourceType: 'Bundle',
      type: 'collection',
      meta: {
        lastUpdated: new Date().toISOString(),
        tag: [{ code: 'FHIR R4 JSON export (prototype)' }],
      },
      total: bundleEntries.length,
      entry: bundleEntries,
    };
  }
}

module.exports = FHIRService;
