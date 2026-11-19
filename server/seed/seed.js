const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const {
  User,
  Trial,
  EthicsApproval,
  Participant,
  Consent,
  Visit,
  AdverseEvent,
  ProtocolDeviation,
  DataQuery,
  RiskPrediction,
  Alert,
  AuditLog,
  Settings,
} = require('../src/models');
const { connectDB, disconnectDB } = require('../src/config/db');
const { CodingService } = require('../src/services/codingService');
const AlertsService = require('../src/services/alertsService');

const PRAKRITIS = ['vata', 'pitta', 'kapha', 'vata-pitta', 'pitta-kapha', 'vata-kapha', 'sama'];
const DOSHA_IMBALANCES = ['Vata Vriddhi', 'Pitta Vriddhi', 'Kapha Vriddhi', 'Tridosha'];

async function seed() {
  console.log('[Seed] Starting idempotent database seed...');
  await connectDB();

  // Clear existing collections for a clean, deterministic seed state
  await Promise.all([
    User.deleteMany({}),
    Trial.deleteMany({}),
    EthicsApproval.deleteMany({}),
    Participant.deleteMany({}),
    Consent.deleteMany({}),
    Visit.deleteMany({}),
    AdverseEvent.deleteMany({}),
    ProtocolDeviation.deleteMany({}),
    DataQuery.deleteMany({}),
    RiskPrediction.deleteMany({}),
    Alert.deleteMany({}),
    AuditLog.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  console.log('[Seed] Cleared collections.');

  // --- 1. Global Settings ---
  const settings = await Settings.create({
    key: 'global_ctms_settings',
    regulatoryTimelines: {
      saeInitialReportDueHours: 24,
      saeDetailedReportDueDays: 14,
      iecExpiryWarningDays: 30,
      queryOverdueDays: 14,
    },
    trialHealthScoreWeights: {
      enrollment: 0.25,
      retention: 0.25,
      compliance: 0.20,
      safety: 0.15,
      quality: 0.15,
    },
    riskBands: {
      lowMax: 0.30,
      mediumMax: 0.60,
    },
  });
  console.log('[Seed] Created Settings.');

  // --- 2. Seed Trials ---
  const standardVisits = [
    { visitNo: 1, name: 'Screening & Baseline', dayOffset: 0, windowDays: 2 },
    { visitNo: 2, name: 'Randomization & Day 14 Check', dayOffset: 14, windowDays: 3 },
    { visitNo: 3, name: 'Day 28 Dropout Risk Assessment', dayOffset: 28, windowDays: 3 },
    { visitNo: 4, name: 'Mid-term Clinical Evaluation', dayOffset: 42, windowDays: 4 },
    { visitNo: 5, name: 'Day 56 Protocol Follow-up', dayOffset: 56, windowDays: 4 },
    { visitNo: 6, name: 'Day 70 Therapeutic Efficacy', dayOffset: 70, windowDays: 4 },
    { visitNo: 7, name: 'Pre-exit Assessment', dayOffset: 84, windowDays: 4 },
    { visitNo: 8, name: 'Final Study Exit & Endpoint', dayOffset: 90, windowDays: 5 },
  ];

  const trial1 = await Trial.create({
    title: 'Evaluation of Yogaraja Guggulu in Sandhivata (Knee Osteoarthritis)',
    shortCode: 'NT-KNEE-01',
    phase: 'Phase II',
    condition: 'Sandhivata (Knee Osteoarthritis)',
    formulation: 'Yogaraja Guggulu (500mg bid) with Janu Basti',
    design: 'Randomized, Double-Blind, Placebo-Controlled',
    targetEnrollment: 150,
    status: 'Active',
    protocolVersion: '2.1',
    startDate: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000), // 65 days ago
    endDate: new Date(Date.now() + 115 * 24 * 60 * 60 * 1000),
    expectedEnrollmentDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    ctri: {
      number: 'CTRI/2026/03/048123',
      registeredAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      prospective: true,
    },
    visitSchedule: standardVisits,
    milestones: [
      { name: 'Protocol Finalization', dueDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), doneAt: new Date(Date.now() - 118 * 24 * 60 * 60 * 1000) },
      { name: 'IEC Approval Secured', dueDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), doneAt: new Date(Date.now() - 92 * 24 * 60 * 60 * 1000) },
      { name: 'First Participant In', dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), doneAt: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000) },
      { name: '50% Enrollment Milestone', dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), doneAt: null },
    ],
  });

  const trial2 = await Trial.create({
    title: 'Efficacy of Nishamalaki Kwatha and Chandraprabha Vati in Madhumeha (Type 2 Diabetes)',
    shortCode: 'NT-DIAB-02',
    phase: 'Phase III',
    condition: 'Madhumeha (Type 2 Diabetes Mellitus)',
    formulation: 'Nishamalaki Kwatha & Chandraprabha Vati',
    design: 'Open-Label, Active-Controlled',
    targetEnrollment: 120,
    status: 'CTRI Registered',
    protocolVersion: '1.4',
    startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 140 * 24 * 60 * 60 * 1000),
    expectedEnrollmentDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    ctri: {
      number: 'CTRI/2026/01/045890',
      registeredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      prospective: true,
    },
    visitSchedule: standardVisits,
    milestones: [
      { name: 'IEC Approval Secured', dueDate: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000), doneAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000) },
      { name: 'CTRI Clearance', dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), doneAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000) },
    ],
  });

  const trial3 = await Trial.create({
    title: 'Comparative Trial of Simhanada Guggulu versus Placebo in Amavata (Rheumatoid Arthritis)',
    shortCode: 'NT-ARTH-03',
    phase: 'Phase II',
    condition: 'Amavata (Rheumatoid Arthritis)',
    formulation: 'Simhanada Guggulu (500mg tid) with Dashamula Kwatha',
    design: 'Randomized, Double-Blind, Placebo-Controlled',
    targetEnrollment: 80,
    status: 'IEC Pending',
    protocolVersion: '1.0',
    startDate: null,
    endDate: null,
    ctri: {
      number: null,
      registeredAt: null,
      prospective: true,
    },
    visitSchedule: standardVisits,
    milestones: [
      { name: 'Protocol Submission to Ethics Committee', dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), doneAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      { name: 'Anticipated IEC Decision', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), doneAt: null },
    ],
  });

  const trialIds = [trial1._id, trial2._id, trial3._id];
  console.log('[Seed] Created 3 Trials.');

  // --- 3. Ethics Approvals ---
  // Trial 1: Active approval valid for 180 more days
  await EthicsApproval.create({
    trialId: trial1._id,
    committeeName: 'All India Institute of Ayurveda Institutional Ethics Committee (AIIA-IEC)',
    approvalNo: 'AIIA-IEC/2025/11/089',
    type: 'initial',
    approvedAt: new Date(Date.now() - 92 * 24 * 60 * 60 * 1000),
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    status: 'Active',
    notes: 'Initial protocol version 2.1 approved with informed consent template.',
  });

  // Trial 2: Ethics approval EXPIRING IN 22 DAYS (triggers IEC_EXPIRY_WARNING alert!)
  await EthicsApproval.create({
    trialId: trial2._id,
    committeeName: 'Institutional Ethics Committee for Clinical Research (IECCR Indore)',
    approvalNo: 'IECCR-2025-06-034',
    type: 'initial',
    approvedAt: new Date(Date.now() - 340 * 24 * 60 * 60 * 1000),
    validUntil: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), // Expiring in 22 days!
    status: 'Active',
    notes: 'Continuing review submission required before expiry.',
  });

  console.log('[Seed] Created Ethics Approvals (including 1 expiring soon).');

  // --- 4. Users (1 per role, bcrypt cost 12) ---
  const pAdmin = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin@NexTrial2026!', 12);
  const pCoord = await bcrypt.hash(process.env.SEED_COORDINATOR_PASSWORD || 'Coordinator@NexTrial2026!', 12);
  const pInvest = await bcrypt.hash(process.env.SEED_INVESTIGATOR_PASSWORD || 'Investigator@NexTrial2026!', 12);
  const pIec = await bcrypt.hash(process.env.SEED_IEC_PASSWORD || 'IECMember@NexTrial2026!', 12);
  const pPv = await bcrypt.hash(process.env.SEED_PV_PASSWORD || 'PVOfficer@NexTrial2026!', 12);
  const pDsmb = await bcrypt.hash(process.env.SEED_DSMB_PASSWORD || 'DSMBReviewer@NexTrial2026!', 12);

  const users = await User.create([
    {
      name: 'Dr. Rajesh Sharma',
      email: 'admin@nextrial.org',
      passwordHash: pAdmin,
      role: 'admin',
      assignedTrials: trialIds,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'Pooja Verma (Clinical Coordinator)',
      email: 'coordinator@nextrial.org',
      passwordHash: pCoord,
      role: 'coordinator',
      assignedTrials: trialIds,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'Prof. Dr. Arvind Joshi (Principal Investigator)',
      email: 'investigator@nextrial.org',
      passwordHash: pInvest,
      role: 'investigator',
      assignedTrials: trialIds,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'Dr. Sunita Deshmukh (IEC Member)',
      email: 'iec@nextrial.org',
      passwordHash: pIec,
      role: 'iec_member',
      assignedTrials: trialIds,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'Dr. Vikram Malhotra (PV Safety Officer)',
      email: 'pvofficer@nextrial.org',
      passwordHash: pPv,
      role: 'pv_officer',
      assignedTrials: trialIds,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'Dr. Ananya Ray (DSMB Chair)',
      email: 'dsmb@nextrial.org',
      passwordHash: pDsmb,
      role: 'dsmb',
      assignedTrials: trialIds,
      isActive: true,
      mustChangePassword: false,
    },
  ]);
  console.log('[Seed] Created 6 role users.');

  const adminUser = users[0];
  const investigatorUser = users[2];
  const coordinatorUser = users[1];

  // --- 5. Generate ~300 Synthetic Participants ---
  // Distribution: Trial 1 = 150, Trial 2 = 110, Trial 3 = 40
  console.log('[Seed] Synthesizing ~300 realistic clinical trial participants with Ayurvedic profiles...');

  const trialConfigs = [
    { trial: trial1, count: 150, prefix: 'NT01', formulation: 'Yogaraja Guggulu', diag: 'Sandhivata (Osteoarthritis)' },
    { trial: trial2, count: 110, prefix: 'NT02', formulation: 'Nishamalaki Kwatha', diag: 'Madhumeha (Type 2 Diabetes)' },
    { trial: trial3, count: 40, prefix: 'NT03', formulation: 'Simhanada Guggulu', diag: 'Amavata (Rheumatoid Arthritis)' },
  ];

  const allParticipants = [];
  const allVisits = [];
  const allConsents = [];

  for (const tc of trialConfigs) {
    const trial = tc.trial;
    const isPendingTrial = trial.status === 'IEC Pending';

    for (let i = 1; i <= tc.count; i++) {
      const subjectId = `${tc.prefix}-${String(i).padStart(4, '0')}`;
      const age = Math.floor(22 + Math.random() * 52); // 22 to 74
      const sex = Math.random() > 0.49 ? 'Female' : 'Male';
      // Lognormal-ish distance
      const distanceKm = Number((Math.exp(Math.random() * 2.2) * 2.5).toFixed(1));

      // Prakriti and Dosha
      const prakriti = PRAKRITIS[Math.floor(Math.random() * PRAKRITIS.length)];
      const doshas = [DOSHA_IMBALANCES[Math.floor(Math.random() * DOSHA_IMBALANCES.length)]];
      if (Math.random() > 0.6) doshas.push(DOSHA_IMBALANCES[Math.floor(Math.random() * DOSHA_IMBALANCES.length)]);

      // Status distribution
      let status = 'Active';
      if (isPendingTrial) {
        status = 'Screened';
      } else {
        const rand = Math.random();
        if (rand < 0.12) status = 'Completed';
        else if (rand < 0.20) status = 'Withdrawn';
        else if (rand < 0.24) status = 'Lost to follow-up';
        else if (rand < 0.30) status = 'Enrolled';
        else status = 'Active';
      }

      const enrolledDaysAgo = isPendingTrial ? null : Math.floor(10 + Math.random() * 55);
      const enrolledAt = enrolledDaysAgo ? new Date(Date.now() - enrolledDaysAgo * 24 * 60 * 60 * 1000) : null;
      const consentStatus = isPendingTrial ? 'Pending' : (status === 'Withdrawn' && Math.random() > 0.5 ? 'Withdrawn' : 'Signed');

      const participantDoc = {
        trialId: trial._id,
        subjectId,
        age,
        sex,
        distanceKm,
        status,
        arm: i % 2 === 0 ? 'Standard Ayurvedic Regimen' : 'Comparative Regimen',
        enrolledAt,
        consentStatus,
        ayurveda: {
          prakriti,
          doshaImbalance: [...new Set(doshas)],
          ayurvedicDiagnosis: tc.diag,
          biomedicalDiagnosis: trial.condition,
          formulation: tc.formulation,
          dosage: '500mg bid after meals',
          procedure: 'Oral administration with warm water / Sukoshna Jala',
          durationDays: 90,
        },
        dropout: (status === 'Withdrawn' || status === 'Lost to follow-up') ? {
          date: new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000),
          reason: distanceKm > 50 ? 'Long travel distance and transportation difficulty' : 'Relocation / personal reasons',
        } : null,
      };

      allParticipants.push(participantDoc);
    }
  }

  const insertedParticipants = await Participant.insertMany(allParticipants);
  console.log(`[Seed] Inserted ${insertedParticipants.length} participants.`);

  // --- 6. Visits & Consents Generation ---
  for (const p of insertedParticipants) {
    if (p.consentStatus === 'Signed') {
      allConsents.push({
        participantId: p._id,
        trialId: p.trialId,
        version: '1.0',
        signedAt: p.enrolledAt || new Date(),
        method: p.age > 60 ? 'Written Paper' : 'Digital e-Consent',
        witnessName: 'Nurse Anita Sharma',
      });
    }

    if (p.enrolledAt) {
      const baseDate = p.enrolledAt;
      standardVisits.forEach((vs, vIdx) => {
        const scheduledDate = new Date(baseDate.getTime() + vs.dayOffset * 24 * 60 * 60 * 1000);
        const windowStart = new Date(scheduledDate.getTime() - vs.windowDays * 24 * 60 * 60 * 1000);
        const windowEnd = new Date(scheduledDate.getTime() + vs.windowDays * 24 * 60 * 60 * 1000);

        let vStatus = 'Scheduled';
        let actualDate = null;

        if (scheduledDate < new Date()) {
          // In the past
          if (p.status === 'Withdrawn' && vIdx >= 3) {
            vStatus = 'Missed';
          } else {
            const rand = Math.random();
            if (rand < 0.78) {
              vStatus = 'Completed';
              actualDate = scheduledDate;
            } else if (rand < 0.90) {
              vStatus = 'Out-of-window';
              actualDate = new Date(scheduledDate.getTime() + (vs.windowDays + 2) * 24 * 60 * 60 * 1000);
            } else {
              vStatus = 'Missed';
            }
          }
        }

        allVisits.push({
          participantId: p._id,
          trialId: p.trialId,
          visitNo: vs.visitNo,
          visitName: vs.name,
          scheduledDate,
          windowStart,
          windowEnd,
          actualDate,
          status: vStatus,
          vitalSigns: vStatus === 'Completed' ? {
            systolicBp: Math.floor(118 + Math.random() * 20),
            diastolicBp: Math.floor(74 + Math.random() * 14),
            pulse: Math.floor(68 + Math.random() * 16),
            temperatureC: 36.8,
            weightKg: Math.floor(58 + Math.random() * 22),
          } : undefined,
          ayurvedicAssessments: vStatus === 'Completed' ? {
            doshaAggravationObserved: Math.random() > 0.7,
            digestiveFireAgni: Math.random() > 0.5 ? 'Sama' : 'Manda',
            bowelHabitsKostha: 'Madhya',
          } : undefined,
        });
      });
    }
  }

  await Consent.insertMany(allConsents);
  await Visit.insertMany(allVisits);
  console.log(`[Seed] Inserted ${allConsents.length} Consents and ${allVisits.length} Visits.`);

  // --- 7. Adverse Events (~60 total, including 5 Serious AEs) ---
  console.log('[Seed] Seeding ~60 Adverse Events with MedDRA demo coding & 5 SAEs...');

  const activeParticipants = insertedParticipants.filter(p => p.enrolledAt !== null);
  const allAEs = [];

  const commonAETerms = [
    { term: 'Mild gastric discomfort after morning dose', soc: 'Gastrointestinal disorders', pt: 'Gastric irritation', code: 'DEMO-10017849', sev: 'Mild' },
    { term: 'Epigastric burning sensation', soc: 'Gastrointestinal disorders', pt: 'Dyspepsia', code: 'DEMO-10013946', sev: 'Moderate' },
    { term: 'Intermittent nausea', soc: 'Gastrointestinal disorders', pt: 'Nausea', code: 'DEMO-10028813', sev: 'Mild' },
    { term: 'Loose stools / diarrhoea for 2 days', soc: 'Gastrointestinal disorders', pt: 'Diarrhoea', code: 'DEMO-10012735', sev: 'Mild' },
    { term: 'Pruritic rash on upper arms', soc: 'Skin and subcutaneous tissue disorders', pt: 'Pruritus', code: 'DEMO-10037087', sev: 'Moderate' },
    { term: 'Frontal tension headache', soc: 'Nervous system disorders', pt: 'Headache', code: 'DEMO-10019211', sev: 'Mild' },
    { term: 'Joint stiffness in morning hours', soc: 'Musculoskeletal and connective tissue disorders', pt: 'Joint stiffness', code: 'DEMO-10023226', sev: 'Mild' },
    { term: 'Mild bilateral ankle oedema', soc: 'General disorders and administration site conditions', pt: 'Oedema peripheral', code: 'DEMO-10030095', sev: 'Moderate' },
    { term: 'Fatigue and lethargy', soc: 'General disorders and administration site conditions', pt: 'Fatigue', code: 'DEMO-10016256', sev: 'Mild' },
  ];

  // 55 Non-serious AEs
  for (let i = 0; i < 55; i++) {
    const p = activeParticipants[i % activeParticipants.length];
    const template = commonAETerms[i % commonAETerms.length];
    const onsetDate = new Date(Date.now() - Math.floor(5 + Math.random() * 35) * 24 * 60 * 60 * 1000);

    allAEs.push({
      participantId: p._id,
      trialId: p.trialId,
      onsetDate,
      reportedAt: new Date(onsetDate.getTime() + 12 * 60 * 60 * 1000),
      verbatimTerm: template.term,
      coded: {
        soc: template.soc,
        pt: template.pt,
        code: template.code,
        dictionaryVersion: 'DEMO-MedDRA-v1',
      },
      severity: template.sev,
      serious: false,
      causality: i % 3 === 0 ? 'Probable' : (i % 3 === 1 ? 'Possible' : 'Unlikely'),
      expected: template.sev === 'Mild',
      outcome: 'Recovered',
      actionTaken: template.sev === 'Moderate' ? 'Dose Reduced' : 'None',
      suspectedFormulation: p.ayurveda.formulation,
      status: 'Closed',
    });
  }

  // 5 Serious Adverse Events (SAE)
  const saeTemplates = [
    // SAE 1: Trial 1, Reported 10 hours ago -> 24h CLOCK ACTIVE!
    {
      trialId: trial1._id,
      participantId: activeParticipants[2]._id,
      verbatimTerm: 'Acute upper gastrointestinal haemorrhage requiring emergency hospitalization',
      soc: 'Gastrointestinal disorders',
      pt: 'Gastric ulcer haemorrhage',
      code: 'DEMO-10017865',
      criteria: ['Hospitalization / Prolongation', 'Other Medically Important Event'],
      hoursAgo: 10,
      reportedToIec: null, // PENDING! Clocks ticking!
    },
    // SAE 2: Trial 1, Reported 18 hours ago -> 24h CLOCK ACTIVE!
    {
      trialId: trial1._id,
      participantId: activeParticipants[7]._id,
      verbatimTerm: 'Severe anaphylactic reaction with acute dyspnoea and facial angioedema',
      soc: 'Respiratory, thoracic and mediastinal disorders',
      pt: 'Dyspnoea',
      code: 'DEMO-10013968',
      criteria: ['Life-threatening', 'Hospitalization / Prolongation'],
      hoursAgo: 18,
      reportedToIec: null, // PENDING!
    },
    // SAE 3: Trial 2, Reported 5 days ago, Reported to IEC within window
    {
      trialId: trial2._id,
      participantId: activeParticipants[25]._id,
      verbatimTerm: 'Severe symptomatic hypoglycaemia with loss of consciousness',
      soc: 'Metabolism and nutrition disorders',
      pt: 'Hypoglycaemia',
      code: 'DEMO-10020993',
      criteria: ['Hospitalization / Prolongation'],
      hoursAgo: 120,
      reportedToIec: new Date(Date.now() - 110 * 60 * 60 * 1000), // Reported within 10h
    },
    // SAE 4: Trial 1, Resolved 20 days ago
    {
      trialId: trial1._id,
      participantId: activeParticipants[35]._id,
      verbatimTerm: 'Exacerbation of osteoarthritis requiring arthroscopic knee intervention',
      soc: 'Musculoskeletal and connective tissue disorders',
      pt: 'Osteoarthritis worsening',
      code: 'DEMO-10031174',
      criteria: ['Hospitalization / Prolongation'],
      hoursAgo: 480,
      reportedToIec: new Date(Date.now() - 470 * 60 * 60 * 1000),
    },
    // SAE 5: Trial 2, Resolved 30 days ago
    {
      trialId: trial2._id,
      participantId: activeParticipants[42]._id,
      verbatimTerm: 'Transient ischemic attack with unilateral limb weakness',
      soc: 'Nervous system disorders',
      pt: 'Syncope',
      code: 'DEMO-10042772',
      criteria: ['Life-threatening'],
      hoursAgo: 720,
      reportedToIec: new Date(Date.now() - 710 * 60 * 60 * 1000),
    },
  ];

  for (const st of saeTemplates) {
    const reportedAt = new Date(Date.now() - st.hoursAgo * 60 * 60 * 1000);
    allAEs.push({
      participantId: st.participantId,
      trialId: st.trialId,
      onsetDate: new Date(reportedAt.getTime() - 8 * 60 * 60 * 1000),
      reportedAt,
      verbatimTerm: st.verbatimTerm,
      coded: {
        soc: st.soc,
        pt: st.pt,
        code: st.code,
        dictionaryVersion: 'DEMO-MedDRA-v1',
      },
      severity: 'Severe',
      serious: true,
      seriousCriteria: st.criteria,
      causality: 'Possible',
      expected: false,
      outcome: st.hoursAgo > 100 ? 'Recovered' : 'Recovering',
      actionTaken: 'Drug Withdrawn',
      suspectedFormulation: 'Yogaraja Guggulu / Nishamalaki Kwatha',
      status: st.reportedToIec ? 'Reported' : 'Open',
      deadlines: {
        initialDue: new Date(reportedAt.getTime() + 24 * 60 * 60 * 1000),
        detailedDue: new Date(reportedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
      reportedTo: {
        iec: st.reportedToIec,
        licensingAuthority: st.reportedToIec ? new Date(st.reportedToIec.getTime() + 2 * 60 * 60 * 1000) : null,
        sponsor: st.reportedToIec,
      },
    });
  }

  await AdverseEvent.insertMany(allAEs);
  console.log(`[Seed] Inserted ${allAEs.length} Adverse Events (including 5 SAEs).`);

  // --- 8. Pre-computed ML Risk Predictions ---
  console.log('[Seed] Seeding pre-computed risk predictions with SHAP attribution...');
  const riskRecords = [];

  for (let i = 0; i < activeParticipants.length; i++) {
    const p = activeParticipants[i];
    // Deterministic spread of low, medium, high risks
    let prob, band, factors;

    if (p.distanceKm > 60 || p.status === 'Withdrawn') {
      prob = Number((0.64 + Math.random() * 0.32).toFixed(4));
      band = 'High';
      factors = [
        { feature: 'missed_visits_so_far', value: 2.0, contribution: 0.142, direction: 'Increases risk', label: 'Missed Visits' },
        { feature: 'distance_km', value: p.distanceKm, contribution: 0.128, direction: 'Increases risk', label: 'Travel Distance' },
        { feature: 'visit_compliance_pct', value: 65.0, contribution: 0.088, direction: 'Increases risk', label: 'Visit Compliance %' },
      ];
    } else if (p.distanceKm > 25 || i % 4 === 0) {
      prob = Number((0.32 + Math.random() * 0.24).toFixed(4));
      band = 'Medium';
      factors = [
        { feature: 'distance_km', value: p.distanceKm, contribution: 0.095, direction: 'Increases risk', label: 'Travel Distance' },
        { feature: 'missed_visits_so_far', value: 1.0, contribution: 0.072, direction: 'Increases risk', label: 'Missed Visits' },
        { feature: 'visit_compliance_pct', value: 82.0, contribution: -0.045, direction: 'Reduces risk', label: 'Visit Compliance %' },
      ];
    } else {
      prob = Number((0.08 + Math.random() * 0.18).toFixed(4));
      band = 'Low';
      factors = [
        { feature: 'visit_compliance_pct', value: 96.0, contribution: -0.112, direction: 'Reduces risk', label: 'Visit Compliance %' },
        { feature: 'distance_km', value: p.distanceKm, contribution: 0.028, direction: 'Increases risk', label: 'Travel Distance' },
        { feature: 'missed_visits_so_far', value: 0.0, contribution: -0.085, direction: 'Reduces risk', label: 'Missed Visits' },
      ];
    }

    riskRecords.push({
      participantId: p._id,
      trialId: p.trialId,
      asOfVisitNo: 3,
      probability: prob,
      band,
      topFactors: factors,
      suggestedActions: band === 'High'
        ? ['Initiate immediate coordinator telephone outreach.', 'Evaluate trial travel assistance options.', 'Review concurrent AE severity.']
        : (band === 'Medium'
            ? ['Send appointment reminders 48h prior to Visit 4.', 'Verify transit convenience.']
            : ['Maintain routine schedule.']),
      modelVersion: 'v1.0-rf',
      computedAt: new Date(),
    });
  }

  await RiskPrediction.insertMany(riskRecords);
  console.log(`[Seed] Inserted ${riskRecords.length} Risk Predictions.`);

  // --- 9. Protocol Deviations & Data Queries ---
  await ProtocolDeviation.create([
    {
      trialId: trial1._id,
      participantId: activeParticipants[4]._id,
      category: 'Visit Out of Window',
      description: 'Visit 2 completed 6 days outside the allowable protocol window due to heavy monsoon rains.',
      severity: 'Minor',
      reportedBy: coordinatorUser._id,
      correctiveAction: 'Rescheduled subsequent visit windows and issued transport guidance.',
      status: 'Resolved',
      resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      trialId: trial1._id,
      participantId: activeParticipants[12]._id,
      category: 'Investigational Product Dosing',
      description: 'Participant missed 4 doses of Yogaraja Guggulu over weekend festival.',
      severity: 'Minor',
      reportedBy: coordinatorUser._id,
      correctiveAction: 'Pill count reconciled, patient re-counseled on regimen adherence.',
      status: 'Reported',
    },
    {
      trialId: trial2._id,
      participantId: activeParticipants[30]._id,
      category: 'Inclusion / Exclusion Criteria',
      description: 'HbA1c level recorded at 10.4% exceeding 10.0% ceiling criteria.',
      severity: 'Major',
      reportedBy: investigatorUser._id,
      correctiveAction: 'Subject placed on safety review with diabetologist consultation.',
      status: 'Under Review',
    },
  ]);

  await DataQuery.create([
    {
      trialId: trial1._id,
      participantId: activeParticipants[1]._id,
      field: 'ayurveda.dosage',
      queryText: 'Discrepancy between CRFs: morning dose recorded as 500mg vs 1000mg in nursing log.',
      status: 'Open',
      raisedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), // >14 days open -> OVERDUE QUERY!
      dueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      raisedBy: investigatorUser._id,
    },
    {
      trialId: trial1._id,
      participantId: activeParticipants[5]._id,
      field: 'vitalSigns.systolicBp',
      queryText: 'Blood pressure reading of 190/110 mmHg requires investigator re-confirmation.',
      status: 'Answered',
      raisedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      raisedBy: coordinatorUser._id,
      answeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      answeredBy: investigatorUser._id,
      answerText: 'Re-checked via manual sphygmomanometer: 142/88 mmHg. Initial reading was transcription error.',
    },
    {
      trialId: trial2._id,
      participantId: activeParticipants[28]._id,
      field: 'ayurveda.doshaImbalance',
      queryText: 'Specify predominant dosha vriddhi sub-type for baseline stratification.',
      status: 'Open',
      raisedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      raisedBy: investigatorUser._id,
    },
  ]);
  console.log('[Seed] Created Protocol Deviations and Data Queries.');

  // --- 10. Run Alert Audit Engine ---
  await AlertsService.runAlertChecks();
  const alertCount = await Alert.countDocuments();
  console.log(`[Seed] Alerts audit completed. Populated ${alertCount} system alerts.`);

  // --- 11. Initial Audit Log Trail with Hash Chaining ---
  const initialAuditEntries = [
    { entity: 'Settings', entityId: settings._id, action: 'CREATE', desc: 'Default CTMS settings initialized' },
    { entity: 'Trial', entityId: trial1._id, action: 'CREATE', desc: 'Trial NT-KNEE-01 registered' },
    { entity: 'Trial', entityId: trial2._id, action: 'CREATE', desc: 'Trial NT-DIAB-02 registered' },
    { entity: 'Trial', entityId: trial3._id, action: 'CREATE', desc: 'Trial NT-ARTH-03 registered' },
    { entity: 'EthicsApproval', entityId: trial1._id, action: 'CREATE', desc: 'Initial ethics approval recorded' },
  ];

  let prevHash = 'GENESIS_HASH_NEXTRIAL_2026';
  for (let idx = 0; idx < initialAuditEntries.length; idx++) {
    const entry = initialAuditEntries[idx];
    const at = new Date(Date.now() - (initialAuditEntries.length - idx) * 3600 * 1000);
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(`${adminUser._id}_${entry.entity}_${entry.entityId}_${entry.action}_${at.toISOString()}_${prevHash}`).digest('hex');

    await AuditLog.create({
      who: adminUser._id,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      entity: entry.entity,
      entityId: entry.entityId.toString(),
      action: entry.action,
      before: null,
      after: { description: entry.desc },
      ipAddress: '127.0.0.1',
      userAgent: 'NexTrial Seed Engine/1.0',
      at,
      previousHash: prevHash,
      hash,
    });
    prevHash = hash;
  }
  console.log('[Seed] Created Hash-Chained Audit Logs.');

  console.log('\n======================================================');
  console.log('✓ SEED COMPLETED SUCCESSFULLY!');
  console.log('Credentials:');
  console.log('  Admin:        admin@nextrial.org        / Admin@NexTrial2026!');
  console.log('  Coordinator:  coordinator@nextrial.org  / Coordinator@NexTrial2026!');
  console.log('  Investigator: investigator@nextrial.org / Investigator@NexTrial2026!');
  console.log('  IEC Member:   iec@nextrial.org          / IECMember@NexTrial2026!');
  console.log('  PV Officer:   pvofficer@nextrial.org    / PVOfficer@NexTrial2026!');
  console.log('  DSMB:         dsmb@nextrial.org         / DSMBReviewer@NexTrial2026!');
  console.log('======================================================\n');

  await disconnectDB();
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
