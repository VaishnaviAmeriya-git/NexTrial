import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import {
  Layers,
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  Download,
  Plus,
  CheckCircle,
  FileText,
  Calendar,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import apiClient from '../api/client';
import PageFrame from '../components/PageFrame';
import StatusBadge from '../components/StatusBadge';
import TrialHealthScoreGauge from '../components/TrialHealthScoreGauge';
import { useAuth } from '../context/AuthContext';

export default function TrialDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [trial, setTrial] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Tab data states
  const [participants, setParticipants] = useState([]);
  const [ethics, setEthics] = useState([]);
  const [adverseEvents, setAdverseEvents] = useState([]);
  const [deviations, setDeviations] = useState([]);
  const [queries, setQueries] = useState([]);
  const [safetySignals, setSafetySignals] = useState(null);

  // Modals
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showAEModal, setShowAEModal] = useState(false);
  const [showCTRIModal, setShowCTRIModal] = useState(false);

  // New Participant Stepper Form
  const [partStep, setPartStep] = useState(1);
  const [partForm, setPartForm] = useState({
    age: 48,
    sex: 'Female',
    distanceKm: 24.5,
    arm: 'Standard Ayurvedic Regimen',
    ayurveda: {
      prakriti: 'vata-kapha',
      doshaImbalance: ['Vata Vriddhi'],
      ayurvedicDiagnosis: '',
      formulation: '',
      dosage: '500mg bid after meals',
      procedure: 'Oral with warm water',
      durationDays: 90,
    },
  });

  // New AE Form
  const [aeForm, setAeForm] = useState({
    participantId: '',
    verbatimTerm: '',
    onsetDate: new Date().toISOString().split('T')[0],
    severity: 'Moderate',
    serious: false,
    seriousCriteria: [],
    causality: 'Possible',
    suspectedFormulation: '',
  });

  // CTRI Form
  const [ctriNumber, setCtriNumber] = useState('');
  const [ctriError, setCtriError] = useState('');

  const loadTrialData = async () => {
    setLoading(true);
    try {
      const [trRes, sumRes] = await Promise.all([
        apiClient.get(`/trials/${id}`),
        apiClient.get(`/trials/${id}/summary`),
      ]);
      setTrial(trRes.data?.data);
      setSummary(sumRes.data?.data);
      setCtriNumber(trRes.data?.data?.ctri?.number || '');

      setPartForm(prev => ({
        ...prev,
        ayurveda: {
          ...prev.ayurveda,
          ayurvedicDiagnosis: trRes.data?.data?.condition || '',
          formulation: trRes.data?.data?.formulation || '',
        },
      }));
      setAeForm(prev => ({
        ...prev,
        suspectedFormulation: trRes.data?.data?.formulation || '',
      }));
    } catch (err) {
      console.error('Failed to load trial detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrialData();
  }, [id]);

  // Lazy tab data loaders
  useEffect(() => {
    if (!id) return;
    if (activeTab === 'participants') {
      apiClient.get(`/trials/${id}/participants`).then(r => setParticipants(r.data?.data || []));
    } else if (activeTab === 'regulatory') {
      apiClient.get(`/trials/${id}/ethics`).then(r => setEthics(r.data?.data || []));
    } else if (activeTab === 'safety') {
      apiClient.get(`/trials/${id}/adverse-events`).then(r => setAdverseEvents(r.data?.data || []));
      apiClient.get(`/trials/${id}/safety-signals`).then(r => setSafetySignals(r.data?.data || null)).catch(() => {});
    } else if (activeTab === 'deviations') {
      apiClient.get(`/trials/${id}/deviations`).then(r => setDeviations(r.data?.data || []));
      apiClient.get(`/trials/${id}/queries`).then(r => setQueries(r.data?.data || []));
    }
  }, [id, activeTab]);

  const handleRegisterParticipant = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/trials/${id}/participants`, partForm);
      setShowParticipantModal(false);
      setPartStep(1);
      // Refresh participants
      const res = await apiClient.get(`/trials/${id}/participants`);
      setParticipants(res.data?.data || []);
      loadTrialData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to register participant');
    }
  };

  const handleLogAE = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/trials/${id}/adverse-events`, aeForm);
      setShowAEModal(false);
      const res = await apiClient.get(`/trials/${id}/adverse-events`);
      setAdverseEvents(res.data?.data || []);
      loadTrialData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to log adverse event');
    }
  };

  const handleUpdateCTRI = async (e) => {
    e.preventDefault();
    setCtriError('');
    try {
      await apiClient.put(`/trials/${id}/ctri`, {
        number: ctriNumber,
        registeredAt: new Date(),
        prospective: true,
      });
      setShowCTRIModal(false);
      loadTrialData();
    } catch (err) {
      setCtriError(err.response?.data?.error?.message || 'Failed to update CTRI');
    }
  };

  const downloadFHIR = async () => {
    try {
      const res = await apiClient.get(`/trials/${id}/export/fhir`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nextrial-fhir-${trial?.shortCode}.json`;
      a.click();
    } catch (e) {
      alert('FHIR export failed');
    }
  };

  const downloadCDISC = async (domain) => {
    try {
      const res = await apiClient.get(`/trials/${id}/export/cdisc?domain=${domain}`);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trial?.shortCode}_${domain}.csv`;
      a.click();
    } catch (e) {
      alert(`Export of ${domain} domain failed`);
    }
  };

  if (loading && !trial) {
    return (
      <PageFrame breadcrumbs={[{ label: 'Trials', to: '/trials' }, { label: 'Loading...' }]}>
        <div className="py-12 text-center text-text-muted">Loading trial details...</div>
      </PageFrame>
    );
  }

  if (!trial) {
    return (
      <PageFrame breadcrumbs={[{ label: 'Trials', to: '/trials' }, { label: 'Not Found' }]}>
        <div className="py-12 text-center text-status-danger">Trial record not found.</div>
      </PageFrame>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview & Health Score' },
    { key: 'regulatory', label: 'Regulatory (CTRI & IEC)' },
    { key: 'participants', label: `Participants (${summary?.enrolled || 0})` },
    { key: 'visits', label: 'Visit Protocol' },
    { key: 'safety', label: 'Safety (AE & SAE Clocks)' },
    { key: 'deviations', label: 'Deviations & Queries' },
    { key: 'exports', label: 'FHIR & SDTM Exports' },
  ];

  return (
    <PageFrame breadcrumbs={[{ label: 'Trials', to: '/trials' }, { label: trial.shortCode }]}>
      {/* Title Header Card */}
      <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-mono text-primary bg-slate-100 px-2.5 py-1 rounded border">
              {trial.shortCode}
            </span>
            <div>
              <h1 className="text-xl font-bold text-primary">{trial.condition}</h1>
              <p className="text-xs text-text-muted max-w-2xl">{trial.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={trial.status} />
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-text-muted rounded border">
              {trial.phase}
            </span>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-text-muted block">Classical Formulation:</span>
            <span className="font-semibold text-text-main">{trial.formulation}</span>
          </div>
          <div>
            <span className="text-text-muted block">Enrolment Target:</span>
            <span className="font-semibold text-text-main font-mono">
              {summary?.enrolled || 0} / {trial.targetEnrollment} ({summary?.enrollmentPct || 0}%)
            </span>
          </div>
          <div>
            <span className="text-text-muted block">CTRI Registration:</span>
            <span className="font-semibold text-text-main font-mono">
              {trial.ctri?.number || <span className="text-amber-700 italic">Pending CTRI</span>}
            </span>
          </div>
          <div>
            <span className="text-text-muted block">Protocol Version:</span>
            <span className="font-semibold text-text-main font-mono">v{trial.protocolVersion}</span>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-border pt-3">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setActiveTab(tb.key)}
              className={`px-3 py-2 text-xs font-semibold rounded-[4px] whitespace-nowrap transition ${
                activeTab === tb.key
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main hover:bg-slate-100'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <TrialHealthScoreGauge healthData={summary?.healthScore} />

          {/* Milestones timeline */}
          <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Protocol Milestones</h3>
            <div className="space-y-3">
              {(trial.milestones || []).map((ms, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 border border-border rounded">
                  <div className="flex items-center gap-2">
                    {ms.doneAt ? (
                      <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-text-muted flex-shrink-0" />
                    )}
                    <span className="font-bold text-text-main">{ms.name}</span>
                  </div>
                  <div className="text-text-muted font-mono">
                    {ms.doneAt ? (
                      <span className="text-status-success font-semibold">
                        Completed on {new Date(ms.doneAt).toLocaleDateString()}
                      </span>
                    ) : ms.dueDate ? (
                      <span>Due: {new Date(ms.dueDate).toLocaleDateString()}</span>
                    ) : (
                      <span>Pending Schedule</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGULATORY (CTRI & IEC) */}
      {activeTab === 'regulatory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CTRI Card */}
            <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold text-primary">CTRI Registration</h3>
                <StatusBadge status={trial.ctri?.number ? 'Active' : 'Unreported'} />
              </div>
              <div className="text-xs space-y-1">
                <div>Registration Number: <strong className="font-mono">{trial.ctri?.number || 'Not Registered'}</strong></div>
                <div>Status: <span>{trial.ctri?.prospective ? 'Prospective Registration' : 'Retrospective'}</span></div>
                <div>Registered Date: <span>{trial.ctri?.registeredAt ? new Date(trial.ctri.registeredAt).toLocaleDateString() : 'N/A'}</span></div>
              </div>
              {['admin', 'coordinator'].includes(user?.role) && (
                <button
                  onClick={() => setShowCTRIModal(true)}
                  className="px-3 py-1.5 bg-white border border-border text-primary hover:bg-slate-50 rounded text-xs font-semibold"
                >
                  Update CTRI Details
                </button>
              )}
            </div>

            {/* IEC Expiry Warning Alert Tile */}
            <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold text-primary">Institutional Ethics Committee (IEC)</h3>
                <span className="text-xs font-semibold text-secondary">AIIA-IEC Guideline</span>
              </div>
              <p className="text-xs text-text-muted">
                Mandatory annual continuing review renewal required 30 days prior to expiry under Indian GCP guidelines.
              </p>
            </div>
          </div>

          {/* Ethics Approvals Table */}
          <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-primary">Ethics Committee Approvals</h3>
            <div className="overflow-x-auto border border-border rounded-[4px]">
              <table className="w-full text-left text-xs table-zebra">
                <thead className="bg-slate-100 border-b border-border uppercase text-text-muted font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Approval No</th>
                    <th className="py-2.5 px-3">Committee</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Approved Date</th>
                    <th className="py-2.5 px-3">Valid Until</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ethics.map((eth) => {
                    const daysLeft = Math.ceil((new Date(eth.validUntil) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={eth._id}>
                        <td className="py-2.5 px-3 font-bold text-primary font-mono">{eth.approvalNo}</td>
                        <td className="py-2.5 px-3 font-medium">{eth.committeeName}</td>
                        <td className="py-2.5 px-3 uppercase">{eth.type}</td>
                        <td className="py-2.5 px-3">{new Date(eth.approvedAt).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3">
                          <span className={daysLeft <= 30 ? 'text-status-danger font-bold' : ''}>
                            {new Date(eth.validUntil).toLocaleDateString()} ({daysLeft} days left)
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={eth.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary">Trial Participant Cohort</h3>
            {['admin', 'coordinator'].includes(user?.role) && (
              <button
                onClick={() => {
                  setPartStep(1);
                  setShowParticipantModal(true);
                }}
                className="h-9 px-3 bg-primary hover:bg-primary-hover text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Participant (Ayurveda Intake)</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-border rounded-[4px] shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs table-zebra">
              <thead className="bg-slate-100 border-b border-border uppercase text-text-muted font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Subject ID</th>
                  <th className="py-2.5 px-3">Age / Sex</th>
                  <th className="py-2.5 px-3">Prakriti</th>
                  <th className="py-2.5 px-3">Dosha Imbalance</th>
                  <th className="py-2.5 px-3">Distance</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Dropout Risk</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {participants.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold font-mono text-primary">{p.subjectId}</td>
                    <td className="py-2.5 px-3">{p.age}y / {p.sex}</td>
                    <td className="py-2.5 px-3 font-semibold capitalize text-secondary">{p.ayurveda?.prakriti}</td>
                    <td className="py-2.5 px-3 text-text-muted">{(p.ayurveda?.doshaImbalance || []).join(', ')}</td>
                    <td className="py-2.5 px-3 font-mono">{p.distanceKm} km</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={p.latestRisk?.band || 'Low'} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <NavLink
                        to={`/participants/${p._id}`}
                        className="px-2.5 py-1 bg-white border border-border hover:bg-slate-50 text-primary font-bold rounded text-[11px]"
                      >
                        Profile
                      </NavLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: VISITS PROTOCOL */}
      {activeTab === 'visits' && (
        <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-primary">Protocol Visit Schedule & Windows</h3>
          <p className="text-xs text-text-muted">
            The defined visit offsets and allowable compliance windows applied during participant intake.
          </p>

          <div className="overflow-x-auto border border-border rounded-[4px]">
            <table className="w-full text-left text-xs table-zebra">
              <thead className="bg-slate-100 border-b border-border uppercase text-text-muted font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Visit No</th>
                  <th className="py-2.5 px-3">Visit Name / Milestone</th>
                  <th className="py-2.5 px-3">Day Offset</th>
                  <th className="py-2.5 px-3">Allowable Window (Days)</th>
                  <th className="py-2.5 px-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(trial.visitSchedule || []).map((vs) => (
                  <tr key={vs.visitNo}>
                    <td className="py-2.5 px-3 font-bold font-mono text-primary">Visit {vs.visitNo}</td>
                    <td className="py-2.5 px-3 font-semibold text-text-main">{vs.name}</td>
                    <td className="py-2.5 px-3 font-mono">Day +{vs.dayOffset}</td>
                    <td className="py-2.5 px-3 font-mono">±{vs.windowDays} days</td>
                    <td className="py-2.5 px-3 text-text-muted">
                      {vs.visitNo === 1 ? 'Screening, baseline Prakriti assessment, and written consent' : (vs.visitNo === 3 ? 'Day 28 Early Dropout Risk Prediction point (SHAP)' : 'Therapeutic efficacy and safety assessment')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SAFETY (AE & SAE CLOCKS) */}
      {activeTab === 'safety' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-primary">Adverse Events & Pharmacovigilance</h3>
              <p className="text-xs text-text-muted">WHO-UMC causality assessments and 24-hour SAE regulatory reporting clocks</p>
            </div>
            {['admin', 'investigator'].includes(user?.role) && (
              <button
                onClick={() => setShowAEModal(true)}
                className="h-9 px-3 bg-status-danger hover:bg-red-800 text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Adverse Event</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-border rounded-[4px] shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs table-zebra">
              <thead className="bg-slate-100 border-b border-border uppercase text-text-muted font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Verbatim AE Term</th>
                  <th className="py-2.5 px-3">MedDRA PT / SOC</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Causality</th>
                  <th className="py-2.5 px-3">SAE 24h Clock</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {adverseEvents.map((ae) => {
                  let clockRemaining = null;
                  if (ae.serious && ae.deadlines?.initialDue) {
                    const msLeft = new Date(ae.deadlines.initialDue) - new Date();
                    const hoursLeft = Math.round(msLeft / (1000 * 60 * 60));
                    clockRemaining = hoursLeft > 0 ? `${hoursLeft}h remaining` : 'EXPIRED / OVERDUE';
                  }

                  return (
                    <tr key={ae._id} className={ae.serious ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 px-3 font-bold font-mono text-primary">
                        {ae.participantId?.subjectId || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-text-main max-w-xs">{ae.verbatimTerm}</td>
                      <td className="py-2.5 px-3 text-text-muted">
                        <div>{ae.coded?.pt || 'Uncoded'}</div>
                        <div className="text-[10px] text-text-muted/80">{ae.coded?.soc}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          ae.severity === 'Severe' ? 'bg-red-100 text-status-danger' : (ae.severity === 'Moderate' ? 'bg-amber-100 text-status-warning' : 'bg-slate-100 text-slate-700')
                        }`}>
                          {ae.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium">{ae.causality}</td>
                      <td className="py-2.5 px-3">
                        {ae.serious ? (
                          <div className="font-mono text-[11px]">
                            {ae.reportedTo?.iec ? (
                              <span className="text-status-success font-bold">✔ Reported to IEC</span>
                            ) : (
                              <span className="text-status-danger font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-pulse" />
                                {clockRemaining}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted">Non-serious</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={ae.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: DEVIATIONS & QUERIES */}
      {activeTab === 'deviations' && (
        <div className="space-y-6">
          {/* Deviations */}
          <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-primary">Protocol Deviations</h3>
            <div className="space-y-2">
              {deviations.map((d) => (
                <div key={d._id} className="p-3 bg-slate-50 border border-border rounded text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-main">{d.category}</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${d.severity === 'Critical' ? 'bg-red-100 text-status-danger' : 'bg-amber-100 text-status-warning'}`}>
                      {d.severity}
                    </span>
                  </div>
                  <p className="text-text-muted">{d.description}</p>
                  {d.correctiveAction && (
                    <div className="text-[11px] text-primary"><strong>CAPA:</strong> {d.correctiveAction}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Queries */}
          <div className="bg-white border border-border rounded-[4px] p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-primary">Data Queries</h3>
            <div className="space-y-2">
              {queries.map((q) => (
                <div key={q._id} className="p-3 bg-slate-50 border border-border rounded text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">Field: {q.field}</span>
                    <StatusBadge status={q.status} />
                  </div>
                  <p className="text-text-main font-medium">{q.queryText}</p>
                  {q.answerText && (
                    <div className="bg-white p-2 border border-border rounded mt-1 text-[11px] text-text-muted">
                      <strong>Answer:</strong> {q.answerText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: EXPORTS (FHIR & CDISC SDTM) */}
      {activeTab === 'exports' && (
        <div className="bg-white border border-border rounded-[4px] p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-primary">Clinical Interoperability Data Exports</h3>
            <p className="text-xs text-text-muted mt-1">
              Download GCP-aligned, SDTM-inspired CSV domains and FHIR R4 JSON clinical trial bundles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FHIR Export Card */}
            <div className="border border-border rounded-[4px] p-4 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary" />
                <h4 className="text-sm font-bold text-primary">FHIR R4 JSON Bundle</h4>
              </div>
              <p className="text-xs text-text-muted">
                Synthesized FHIR R4 Bundle containing ResearchStudy, pseudonymized Patient records, AdverseEvents, and visit Observations.
              </p>
              <button
                onClick={downloadFHIR}
                className="h-9 px-4 bg-primary hover:bg-primary-hover text-white rounded text-xs font-semibold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download FHIR R4 JSON</span>
              </button>
            </div>

            {/* CDISC SDTM Export Card */}
            <div className="border border-border rounded-[4px] p-4 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-status-success" />
                <h4 className="text-sm font-bold text-primary">CDISC SDTM-Inspired CSV Datasets</h4>
              </div>
              <p className="text-xs text-text-muted">
                Standard clinical research domains: DM (Demographics), AE (Adverse Events), EX (Exposure), and custom AY (Ayurvedic Dosha/Prakriti).
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => downloadCDISC('DM')}
                  className="px-2.5 py-1 bg-white border border-border hover:bg-slate-100 rounded text-xs font-bold text-primary"
                >
                  Download DM.csv
                </button>
                <button
                  onClick={() => downloadCDISC('AE')}
                  className="px-2.5 py-1 bg-white border border-border hover:bg-slate-100 rounded text-xs font-bold text-primary"
                >
                  Download AE.csv
                </button>
                <button
                  onClick={() => downloadCDISC('EX')}
                  className="px-2.5 py-1 bg-white border border-border hover:bg-slate-100 rounded text-xs font-bold text-primary"
                >
                  Download EX.csv
                </button>
                <button
                  onClick={() => downloadCDISC('AY')}
                  className="px-2.5 py-1 bg-white border border-border hover:bg-slate-100 rounded text-xs font-bold text-secondary"
                >
                  Download AY (Ayurveda).csv
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Participant Intake Stepper (3 Steps) */}
      {showParticipantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-[4px] border border-border shadow-lg max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-bold text-primary">Participant Intake & Registration</h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                  <span className={`px-2 py-0.5 rounded font-bold ${partStep === 1 ? 'bg-primary text-white' : 'bg-slate-100'}`}>Step 1: Basic</span>
                  <span>&gt;</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${partStep === 2 ? 'bg-primary text-white' : 'bg-slate-100'}`}>Step 2: Ayurveda</span>
                  <span>&gt;</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${partStep === 3 ? 'bg-primary text-white' : 'bg-slate-100'}`}>Step 3: Arm & Consent</span>
                </div>
              </div>
              <button onClick={() => setShowParticipantModal(false)} className="text-text-muted hover:text-text-main text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleRegisterParticipant} className="space-y-4 text-xs">
              {partStep === 1 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-text-main">Age (Years) <span className="text-status-danger">*</span></label>
                      <input
                        type="number"
                        min="18"
                        max="100"
                        required
                        value={partForm.age}
                        onChange={(e) => setPartForm({ ...partForm, age: parseInt(e.target.value, 10) })}
                        className="w-full h-9 px-3 border border-border rounded focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-text-main">Gender <span className="text-status-danger">*</span></label>
                      <select
                        value={partForm.sex}
                        onChange={(e) => setPartForm({ ...partForm, sex: e.target.value })}
                        className="w-full h-9 px-2 border border-border rounded focus:outline-none"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-text-main">Distance to Trial Site (km) <span className="text-status-danger">*</span></label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={partForm.distanceKm}
                      onChange={(e) => setPartForm({ ...partForm, distanceKm: parseFloat(e.target.value) })}
                      className="w-full h-9 px-3 border border-border rounded focus:outline-none"
                    />
                    <p className="text-[11px] text-text-muted">Used by ML model for travel adherence risk assessment.</p>
                  </div>
                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setPartStep(2)}
                      className="h-9 px-4 bg-primary text-white font-semibold rounded"
                    >
                      Next: Ayurveda Profile →
                    </button>
                  </div>
                </div>
              )}

              {partStep === 2 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-text-main">Prakriti (Constitution) <span className="text-status-danger">*</span></label>
                      <select
                        value={partForm.ayurveda.prakriti}
                        onChange={(e) => setPartForm({
                          ...partForm,
                          ayurveda: { ...partForm.ayurveda, prakriti: e.target.value },
                        })}
                        className="w-full h-9 px-2 border border-border rounded capitalize focus:outline-none"
                      >
                        <option value="vata">Vata</option>
                        <option value="pitta">Pitta</option>
                        <option value="kapha">Kapha</option>
                        <option value="vata-pitta">Vata-Pitta</option>
                        <option value="pitta-kapha">Pitta-Kapha</option>
                        <option value="vata-kapha">Vata-Kapha</option>
                        <option value="sama">Sama (Tridoshaja)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-text-main">Primary Dosha Imbalance</label>
                      <select
                        value={partForm.ayurveda.doshaImbalance[0] || 'Vata Vriddhi'}
                        onChange={(e) => setPartForm({
                          ...partForm,
                          ayurveda: { ...partForm.ayurveda, doshaImbalance: [e.target.value] },
                        })}
                        className="w-full h-9 px-2 border border-border rounded focus:outline-none"
                      >
                        <option value="Vata Vriddhi">Vata Vriddhi</option>
                        <option value="Pitta Vriddhi">Pitta Vriddhi</option>
                        <option value="Kapha Vriddhi">Kapha Vriddhi</option>
                        <option value="Tridosha">Tridosha</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-text-main">Ayurvedic Diagnosis (Nidana / Samprapti)</label>
                    <input
                      type="text"
                      required
                      value={partForm.ayurveda.ayurvedicDiagnosis}
                      onChange={(e) => setPartForm({
                        ...partForm,
                        ayurveda: { ...partForm.ayurveda, ayurvedicDiagnosis: e.target.value },
                      })}
                      className="w-full h-9 px-3 border border-border rounded focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-text-main">Investigational Ayurvedic Formulation</label>
                    <input
                      type="text"
                      required
                      value={partForm.ayurveda.formulation}
                      onChange={(e) => setPartForm({
                        ...partForm,
                        ayurveda: { ...partForm.ayurveda, formulation: e.target.value },
                      })}
                      className="w-full h-9 px-3 border border-border rounded focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setPartStep(1)}
                      className="h-9 px-4 border border-border bg-white text-text-main rounded"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setPartStep(3)}
                      className="h-9 px-4 bg-primary text-white font-semibold rounded"
                    >
                      Next: Consent & Arm →
                    </button>
                  </div>
                </div>
              )}

              {partStep === 3 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-text-main">Trial Treatment Arm</label>
                    <select
                      value={partForm.arm}
                      onChange={(e) => setPartForm({ ...partForm, arm: e.target.value })}
                      className="w-full h-9 px-2 border border-border rounded focus:outline-none"
                    >
                      <option value="Standard Ayurvedic Regimen">Standard Ayurvedic Regimen</option>
                      <option value="Comparative Active Control">Comparative Active Control</option>
                      <option value="Placebo Control">Placebo Control</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-50 border border-border rounded space-y-1 text-xs">
                    <div className="font-bold text-primary">Informed Consent Notice</div>
                    <p className="text-text-muted">
                      Registering will record initial screening, assign unique subject ID pseudonym, and generate the full 8-visit compliance calendar.
                    </p>
                  </div>

                  <div className="flex justify-between pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setPartStep(2)}
                      className="h-9 px-4 border border-border bg-white text-text-main rounded"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="h-9 px-4 bg-status-success text-white font-semibold rounded"
                    >
                      Confirm Registration & Schedule Visits
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log AE */}
      {showAEModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-[4px] border border-border shadow-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-primary">Log Adverse Event (AE / SAE)</h2>
              <button onClick={() => setShowAEModal(false)} className="text-text-muted hover:text-text-main text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleLogAE} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-main">Participant (Subject ID) *</label>
                <select
                  required
                  value={aeForm.participantId}
                  onChange={(e) => setAeForm({ ...aeForm, participantId: e.target.value })}
                  className="w-full h-9 px-2 border border-border rounded focus:outline-none font-mono"
                >
                  <option value="">Select participant...</option>
                  {participants.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.subjectId} ({p.age}y {p.sex})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-main">Verbatim AE Term *</label>
                <input
                  type="text"
                  required
                  value={aeForm.verbatimTerm}
                  onChange={(e) => setAeForm({ ...aeForm, verbatimTerm: e.target.value })}
                  placeholder="e.g. Severe epigastric burning with nausea"
                  className="w-full h-9 px-3 border border-border rounded focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-main">Severity</label>
                  <select
                    value={aeForm.severity}
                    onChange={(e) => setAeForm({ ...aeForm, severity: e.target.value })}
                    className="w-full h-9 px-2 border border-border rounded focus:outline-none"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-main">WHO-UMC Causality</label>
                  <select
                    value={aeForm.causality}
                    onChange={(e) => setAeForm({ ...aeForm, causality: e.target.value })}
                    className="w-full h-9 px-2 border border-border rounded focus:outline-none"
                  >
                    <option value="Certain">Certain</option>
                    <option value="Probable">Probable</option>
                    <option value="Possible">Possible</option>
                    <option value="Unlikely">Unlikely</option>
                    <option value="Unassessable">Unassessable</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded space-y-2">
                <label className="flex items-center gap-2 font-bold text-status-danger cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aeForm.serious}
                    onChange={(e) => setAeForm({ ...aeForm, serious: e.target.checked })}
                    className="rounded text-status-danger focus:ring-status-danger"
                  />
                  <span>Mark as Serious Adverse Event (SAE)</span>
                </label>
                {aeForm.serious && (
                  <p className="text-[11px] text-red-900 leading-tight">
                    ⚠ Activating SAE status initiates the <strong>24-hour mandatory IEC regulatory clock</strong> and triggers urgent notification alerts.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAEModal(false)}
                  className="h-9 px-4 border border-border bg-white text-text-main rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-primary text-white font-semibold rounded"
                >
                  Save Adverse Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update CTRI */}
      {showCTRIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-[4px] border border-border shadow-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-primary">Update CTRI Registration</h2>
            {ctriError && <div className="p-2 bg-red-50 text-status-danger rounded text-xs">{ctriError}</div>}
            <form onSubmit={handleUpdateCTRI} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-text-main">CTRI Number</label>
                <input
                  type="text"
                  required
                  placeholder="CTRI/2026/03/048123"
                  value={ctriNumber}
                  onChange={(e) => setCtriNumber(e.target.value)}
                  className="w-full h-9 px-3 border border-border rounded font-mono uppercase focus:outline-none"
                />
                <p className="text-[11px] text-text-muted">Format: CTRI/YYYY/MM/NNNNNN</p>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowCTRIModal(false)} className="h-9 px-4 border border-border bg-white rounded">
                  Cancel
                </button>
                <button type="submit" className="h-9 px-4 bg-primary text-white font-semibold rounded">
                  Save CTRI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
