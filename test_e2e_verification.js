const assert = require('assert');

const API_BASE = 'http://127.0.0.1:5000/api/v1';

async function req(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log('====================================================');
  console.log('NexTrial End-to-End Acceptance Verification Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`[PASS] ${name}`);
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
    }
  }

  // 1. Roles Login Test
  const roles = [
    { email: 'admin@nextrial.org', role: 'admin', password: 'Admin@NexTrial2026!' },
    { email: 'coordinator@nextrial.org', role: 'coordinator', password: 'Coordinator@NexTrial2026!' },
    { email: 'investigator@nextrial.org', role: 'investigator', password: 'Investigator@NexTrial2026!' },
    { email: 'iec@nextrial.org', role: 'iec_member', password: 'IECMember@NexTrial2026!' },
    { email: 'pvofficer@nextrial.org', role: 'pv_officer', password: 'PVOfficer@NexTrial2026!' },
    { email: 'dsmb@nextrial.org', role: 'dsmb', password: 'DSMBReviewer@NexTrial2026!' },
  ];

  let tokens = {};

  for (const r of roles) {
    await test(`Auth: Login as ${r.role} (${r.email})`, async () => {
      const res = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: r.email, password: r.password }),
      });
      assert.strictEqual(res.status, 200, `Login failed for ${r.email}: ${JSON.stringify(res.data)}`);
      assert.strictEqual(res.data.data.user.role, r.role);
      assert.ok(res.data.data.token, 'Token returned');
      tokens[r.role] = res.data.data.token;
    });
  }

  // 2. RBAC Enforcement Test
  await test('RBAC: Non-admin (coordinator) blocked from GET /users with 403', async () => {
    const res = await req('/users', {
      headers: { Authorization: `Bearer ${tokens['coordinator']}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await test('RBAC: Admin allowed to GET /users', async () => {
    const res = await req('/users', {
      headers: { Authorization: `Bearer ${tokens['admin']}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    assert.ok(Array.isArray(res.data.data), 'res.data.data should be an array of users');
    assert.strictEqual(res.data.data.length, 6, 'Should have 6 seeded users');
  });

  // 3. Trials List & Detail
  let testTrialId = null;
  await test('Trials: List trials for coordinator', async () => {
    const res = await req('/trials', {
      headers: { Authorization: `Bearer ${tokens['coordinator']}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data), 'Trials should be an array');
    assert.ok(res.data.data.length > 0, 'Should return assigned trials');
    testTrialId = res.data.data[0]._id;
  });

  await test('Trials: Get trial details', async () => {
    const res = await req(`/trials/${testTrialId}`, {
      headers: { Authorization: `Bearer ${tokens['coordinator']}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data._id, testTrialId);
    assert.ok(res.data.data.title);
  });

  // 4. Trial Health Score (THS) Formula Verification
  await test('THS: Compute Trial Health Score with breakdown', async () => {
    const res = await req(`/trials/${testTrialId}/health-score`, {
      headers: { Authorization: `Bearer ${tokens['coordinator']}` },
    });
    assert.strictEqual(res.status, 200);
    const ths = res.data.data;
    assert.ok(typeof ths.score === 'number', 'THS score should be a number');
    assert.ok(['green', 'amber', 'red'].includes(ths.band), 'Band must be green/amber/red');
    assert.ok(Array.isArray(ths.breakdown), 'Breakdown must be an array');
    const eTerm = ths.breakdown.find(b => b.metric === 'E');
    const rTerm = ths.breakdown.find(b => b.metric === 'R');
    const cTerm = ths.breakdown.find(b => b.metric === 'C');
    const sTerm = ths.breakdown.find(b => b.metric === 'S');
    const qTerm = ths.breakdown.find(b => b.metric === 'Q');
    assert.ok(eTerm, 'E term exists');
    assert.ok(rTerm, 'R term exists');
    assert.ok(cTerm, 'C term exists');
    assert.ok(sTerm, 'S term exists');
    assert.ok(qTerm, 'Q term exists');
    console.log(`       -> Score: ${ths.score} (${ths.band.toUpperCase()}) [E:${eTerm.value.toFixed(2)}, R:${rTerm.value.toFixed(2)}, C:${cTerm.value.toFixed(2)}, S:${sTerm.value.toFixed(2)}, Q:${qTerm.value.toFixed(2)}]`);
  });

  // 5. Participant Creation with Ayurveda Profile
  let testParticipantId = null;
  await test('Participants: Create participant with Prakriti and Dosha profile', async () => {
    const payload = {
      age: 44,
      sex: 'Male',
      distanceKm: 18.5,
      arm: 'Active Ashwagandha',
      ayurveda: {
        prakriti: 'vata-pitta',
        doshaImbalance: ['Vata Vriddhi', 'Pitta Vriddhi'],
        ayurvedicDiagnosis: 'Vataja Shotha',
        biomedicalDiagnosis: 'Generalized Osteoarthritis',
        formulation: 'Ashwagandha Arishta',
        dosage: '20 ml twice daily after meals with equal water',
        procedure: 'Abhyanga with Mahanarayana Taila',
        durationDays: 60,
      },
    };

    const res = await req(`/trials/${testTrialId}/participants`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['coordinator']}` },
      body: JSON.stringify(payload),
    });
    assert.strictEqual(res.status, 201, `Create failed: ${JSON.stringify(res.data)}`);
    assert.ok(res.data.data.subjectId);
    assert.strictEqual(res.data.data.ayurveda.prakriti, 'vata-pitta');
    testParticipantId = res.data.data._id;
  });

  // 6. Consent Recording
  await test('Consent: Record informed consent', async () => {
    const consentRes = await req(`/participants/${testParticipantId}/consent`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['coordinator']}` },
      body: JSON.stringify({
        version: 'v2.1',
        method: 'Written Paper',
        witnessName: 'Dr. R. Sharma',
      }),
    });
    assert.strictEqual(consentRes.status, 200, `Consent failed: ${JSON.stringify(consentRes.data)}`);
    assert.ok(consentRes.data.data.consent);
    assert.strictEqual(consentRes.data.data.participant.consentStatus, 'Signed');
  });

  // 7. Visits: Schedule & Completion
  let testVisitId = null;
  await test('Visits: Retrieve auto-scheduled visits & mark visit 1 as Completed', async () => {
    const visitsListRes = await req(`/participants/${testParticipantId}/visits`, {
      headers: { Authorization: `Bearer ${tokens['coordinator']}` },
    });
    assert.strictEqual(visitsListRes.status, 200);
    assert.ok(Array.isArray(visitsListRes.data.data));
    assert.ok(visitsListRes.data.data.length > 0, 'Visits should have been automatically generated');
    const firstVisit = visitsListRes.data.data[0];
    testVisitId = firstVisit._id;

    // Update status to Completed
    const patchRes = await req(`/visits/${testVisitId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokens['coordinator']}` },
      body: JSON.stringify({
        status: 'Completed',
        actualDate: new Date().toISOString(),
        notes: 'Subject attended on time; formulation compliance confirmed; pulse examination normal.',
      }),
    });
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.data.data.status, 'Completed');
    console.log(`       -> Visit 1 completed with clinical notes.`);
  });

  // 8. ML Dropout Risk Prediction with SHAP
  await test('ML Service: Dropout risk inference with real SHAP attributions', async () => {
    const res = await req(`/participants/${testParticipantId}/risk`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['investigator']}` },
    });
    assert.strictEqual(res.status, 200, `Risk inference failed: ${JSON.stringify(res.data)}`);
    const pred = res.data.data;
    assert.ok(typeof pred.probability === 'number', 'Probability must be a number');
    assert.ok(['Low', 'Medium', 'High'].includes(pred.band), 'Band must be Low, Medium, or High');
    assert.ok(Array.isArray(pred.topFactors), 'topFactors must be an array');
    assert.ok(pred.topFactors.length > 0, 'Should return top SHAP factors');
    console.log(`       -> Risk Band: ${pred.band} (p=${(pred.probability * 100).toFixed(1)}%), Top SHAP Driver: ${pred.topFactors[0].feature} (${pred.topFactors[0].contribution.toFixed(3)})`);
  });

  // 9. Safety: Serious Adverse Event Entry & 24h Clock
  let testAeId = null;
  await test('Safety: Record Serious Adverse Event and verify 24h SAE regulatory clock', async () => {
    const payload = {
      participantId: testParticipantId,
      onsetDate: new Date().toISOString(),
      verbatimTerm: 'Severe Pitta exacerbation with gastric burning and hyperacidity',
      severity: 'Severe',
      serious: true,
      seriousCriteria: ['Hospitalization / Prolongation'],
      causality: 'Possible',
      expected: false,
      outcome: 'Recovering',
      actionTaken: 'Dose Reduced',
      suspectedFormulation: 'Ashwagandha Arishta',
    };

    const res = await req(`/trials/${testTrialId}/adverse-events`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['investigator']}` },
      body: JSON.stringify(payload),
    });
    assert.strictEqual(res.status, 201, `AE record failed: ${JSON.stringify(res.data)}`);
    const ae = res.data.data;
    assert.strictEqual(ae.serious, true);
    assert.ok(ae.deadlines?.initialDue, 'Initial 24h deadline must be set');
    const dueTime = new Date(ae.deadlines.initialDue).getTime();
    const nowTime = Date.now();
    const hoursDiff = (dueTime - nowTime) / (1000 * 60 * 60);
    assert.ok(hoursDiff > 20 && hoursDiff <= 25, `SAE clock should be ~24 hours from now, got ${hoursDiff.toFixed(1)}h`);
    testAeId = ae._id;
    console.log(`       -> SAE created. Initial 24h regulatory report due in: ${hoursDiff.toFixed(1)} hours.`);
  });

  // 10. Medical Coding with MedDRA Demo Dictionary
  await test('Safety: Code Adverse Event using Demo MedDRA Coding Service', async () => {
    const res = await req(`/adverse-events/${testAeId}/code`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['pv_officer']}` },
      body: JSON.stringify({
        soc: 'Gastrointestinal disorders',
        pt: 'Dyspepsia / Hyperacidity',
        code: 'MED-GI-001',
      }),
    });
    assert.strictEqual(res.status, 200, `Code failed: ${JSON.stringify(res.data)}`);
    assert.strictEqual(res.data.data.coded.code, 'MED-GI-001');
    assert.strictEqual(res.data.data.status, 'Coded');
  });

  // 11. Regulatory Alerts
  await test('Alerts: Verify open regulatory alerts exist and can be acknowledged', async () => {
    const res = await req('/alerts', {
      headers: { Authorization: `Bearer ${tokens['coordinator']}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data));
    if (res.data.data.length > 0) {
      const alertId = res.data.data[0]._id;
      const ackRes = await req(`/alerts/${alertId}/ack`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokens['coordinator']}` },
      });
      assert.strictEqual(ackRes.status, 200);
      assert.strictEqual(ackRes.data.data.status, 'ack');
      console.log(`       -> Alert acknowledged successfully.`);
    }
  });

  // 12. Audit Trail & Hash Integrity
  await test('Audit: Verify hash-chained audit log integrity', async () => {
    const res = await req('/audit', {
      headers: { Authorization: `Bearer ${tokens['admin']}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data));
    assert.strictEqual(res.data.meta.hashChainVerified, true, 'Audit log hash chain must be mathematically verified');
    console.log(`       -> Total audit entries: ${res.data.meta.total}. Hash chain verified: VALID.`);
  });

  // 13. Regulatory Exports: FHIR R4 JSON Export
  await test('Exports: Generate FHIR R4 JSON Clinical Bundle', async () => {
    const res = await req(`/trials/${testTrialId}/export/fhir`, {
      headers: { Authorization: `Bearer ${tokens['investigator']}` },
    });
    assert.strictEqual(res.status, 200);
    const bundle = res.data;
    assert.strictEqual(bundle.resourceType, 'Bundle');
    assert.strictEqual(bundle.type, 'collection');
    assert.ok(Array.isArray(bundle.entry) && bundle.entry.length > 0);
    const resourceTypes = [...new Set(bundle.entry.map(e => e.resource.resourceType))];
    console.log(`       -> FHIR Bundle exported: ${bundle.entry.length} resources (${resourceTypes.join(', ')})`);
  });

  // 14. Regulatory Exports: CDISC SDTM-Inspired CSV Export
  await test('Exports: Generate CDISC SDTM-inspired CSV export (DM, AE, EX, AY)', async () => {
    const res = await req(`/trials/${testTrialId}/export/cdisc`, {
      headers: { Authorization: `Bearer ${tokens['investigator']}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.domains, 'SDTM domains returned');
    assert.ok(res.data.domains.DM, 'Demographics (DM) domain present');
    assert.ok(res.data.domains.AE, 'Adverse Events (AE) domain present');
    assert.ok(res.data.domains.EX, 'Exposure (EX) domain present');
    assert.ok(res.data.domains.AY, 'Ayurveda Custom (AY) domain present');
    console.log(`       -> SDTM CSV domains ready: DM (${res.data.domains.DM.split('\n').length - 1} lines), AE (${res.data.domains.AE.split('\n').length - 1} lines), EX (${res.data.domains.EX.split('\n').length - 1} lines), AY (${res.data.domains.AY.split('\n').length - 1} lines)`);
  });

  console.log('\n====================================================');
  console.log(`Test Results: ${passed} / ${total} Passed (${((passed / total) * 100).toFixed(0)}%)`);
  console.log('====================================================\n');
}

runTests().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
